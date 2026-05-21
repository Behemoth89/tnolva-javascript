<template>
  <div class="organizer-markings">
    <div class="markings-header">
      <el-button @click="goBack">{{ t('common.back') }}</el-button>
      <h2>{{ t('organizer.liveMarkings') }}: {{ contest?.name }}</h2>
      <el-tag type="success" v-if="isPolling">{{ t('organizer.live') }}</el-tag>
    </div>

    <div class="markings-info">
      <span>{{ t('organizer.totalMarkings') }}: {{ totalCount }}</span>
      <el-button size="small" @click="refresh">{{ t('common.refresh') }}</el-button>
    </div>

    <el-table :data="markings" stripe>
      <el-table-column prop="teamName" :label="t('marking.team')" />
      <el-table-column prop="cpCode" :label="t('marking.cp')" />
      <el-table-column prop="score" :label="t('marking.score')" />
      <el-table-column :label="t('marking.time')">
        <template #default="{ row }">
          {{ formatDateTime(row.dt) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('marking.location')">
        <template #default="{ row }">
          {{ row.lat?.toFixed(5) ?? '-' }}, {{ row.lon?.toFixed(5) ?? '-' }}
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
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { organiserApi } from '@/api/endpoints/organiser'
import type { OrganiserContestDetails, OrganiserMarkingListItem } from '@/types/api'

const { t } = useI18n()
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
  router.push(`/organizer/contest/${contestId.value}`)
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