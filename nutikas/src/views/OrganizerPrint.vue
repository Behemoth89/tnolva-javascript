<template>
  <div class="organizer-print">
    <div class="print-header">
      <el-button @click="goBack">Back</el-button>
      <h2>Print QR Codes: {{ contest?.name }}</h2>
      <el-button type="primary" @click="generatePdf">
        Download PDF
      </el-button>
    </div>

    <div v-if="qrMapLoading" class="loading">Loading...</div>

    <div v-else class="qr-grid">
      <div v-for="cp in checkpoints" :key="cp.id" class="qr-cell">
        <img v-if="qrMap[cp.cpid]" :src="qrMap[cp.cpid]" :alt="cp.cpid" />
        <div class="qr-label">{{ cp.cpCode }}</div>
        <div class="qr-cpid">{{ cp.cpid }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { jsPDF } from 'jspdf'
import { organiserApi } from '@/api/endpoints/organiser'
import { useQrCode } from '@/composables/useQrCode'
import type { OrganiserContestDetails, OrganiserCheckPointDetails } from '@/types/api'

const route = useRoute()
const router = useRouter()
const { generateQrDataUrl } = useQrCode()

const contest = ref<OrganiserContestDetails | null>(null)
const checkpoints = ref<OrganiserCheckPointDetails[]>([])
const qrMap = ref<Record<string, string>>({})
const qrMapLoading = ref(true)

const contestId = computed(() => route.params.contestId as string)

onMounted(async () => {
  contest.value = await organiserApi.getContest(contestId.value)
  checkpoints.value = await organiserApi.getCheckpoints(contestId.value)

  // Generate QR images for all checkpoints
  qrMapLoading.value = true
  for (const cp of checkpoints.value) {
    qrMap.value[cp.cpid] = await generateQrDataUrl(cp.cpid)
  }
  qrMapLoading.value = false
})

function goBack() {
  router.push(`/organizer/contest/${contestId.value}`)
}

async function generatePdf() {
  const doc = new jsPDF()
  const cols = 3
  const cellW = 60
  const cellH = 70
  const startX = 15
  const startY = 20

  for (let i = 0; i < checkpoints.value.length; i++) {
    const cp = checkpoints.value[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = startX + col * cellW
    const y = startY + row * cellH

    const qrDataUrl = qrMap.value[cp.cpid]
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', x, y, 40, 40)
    }
    doc.text(cp.cpCode, x + 20, y + 48, { align: 'center' })
    doc.text(cp.cpid, x, y + 55, { align: 'center' })
  }

  doc.save(`${contest.value?.name ?? 'checkpoints'}-qrs.pdf`)
}
</script>

<style scoped>
.organizer-print {
  padding: 20px;
}

.print-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.print-header h2 {
  flex: 1;
  margin: 0;
}

.loading {
  text-align: center;
  padding: 40px;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

.qr-cell {
  text-align: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.qr-cell img {
  width: 120px;
  height: 120px;
}

.qr-label {
  font-size: 18px;
  font-weight: bold;
  margin-top: 10px;
}

.qr-cpid {
  font-size: 12px;
  color: #666;
}
</style>