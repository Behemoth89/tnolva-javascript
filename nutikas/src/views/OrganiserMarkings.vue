<template>
  <div class="organizer-markings">
    <div class="markings-header">
      <el-button @click="goBack">Back</el-button>
      <h2>Live Markings: {{ contest?.name }}</h2>
      <el-tag type="success" v-if="isPolling">LIVE</el-tag>
    </div>

    <div class="markings-info">
      <span>Total: {{ totalCount }}</span>
      <el-button size="small" @click="refresh">Refresh</el-button>
    </div>

    <el-table :data="markings" stripe>
      <el-table-column prop="teamName" label="Team" />
      <el-table-column prop="checkPointCPCode" label="CP" />
      <el-table-column prop="score" label="Score" />
      <el-table-column label="Time">
        <template #default="{ row }">
          {{ formatDateTime(row.dt) }}
        </template>
      </el-table-column>
      <el-table-column label="Location">
        <template #default="{ row }">
          {{ row.lat ?? '-' }}, {{ row.lon ?? '-' }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="totalCount"
      layout="prev, pager, next, total"
      @current-change="loadMarkings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { organiserApi } from '@/api/endpoints/organiser'
import type { OrganiserContestDetails, OrganiserMarkingListItem } from '@/types/api'

const route = useRoute()
const router = useRouter()

const contest = ref<OrganiserContestDetails | null>(null)
const markings = ref<OrganiserMarkingListItem[]>([])
const totalCount = ref(0)
const page = ref(1)
const pageSize = 50
const isPolling = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

const contestId = computed(() => route.params.contestId as string)

onMounted(async () => {
  contest.value = await organiserApi.getContest(contestId.value)
  await loadMarkings()

  // Start polling every 10 seconds
  isPolling.value = true
  pollInterval = setInterval(loadMarkings, 10000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})

async function loadMarkings() {
  const resp = await organiserApi.getMarkings(contestId.value, page.value, pageSize)
  markings.value = resp.items
  totalCount.value = resp.totalCount
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function goBack() {
  router.push(`/organiser/contest/${contestId.value}`)
}

async function refresh() {
  await loadMarkings()
}
</script>

<style scoped>
.organizer-markings {
  padding: 20px;
}

.markings-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.markings-header h2 {
  flex: 1;
  margin: 0;
}

.markings-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}
</style>