<template>
  <div class="organizer-dashboard">
    <div class="dashboard-header">
      <h1>{{ t('organizer.title') }}</h1>
      <el-button type="primary" @click="createContest">
        {{ t('organizer.createContest') }}
      </el-button>
    </div>

    <!-- Loading state -->
    <div v-if="store.isLoading" class="loading">
      {{ t('common.loading') }}
    </div>

    <!-- Error state -->
    <el-alert v-if="store.error" type="error" :title="store.error" @close="store.clearError()" />

    <!-- Empty state for new organizers -->
    <div v-else-if="store.contests.length === 0" class="empty-state">
      <p>{{ t('organizer.noContests') }}</p>
      <el-button type="primary" @click="createContest">
        {{ t('organizer.createFirst') }}
      </el-button>
    </div>

    <!-- Contests list -->
    <div v-else class="contests-list">
      <el-table :data="store.contests" stripe>
        <el-table-column prop="name" :label="t('contest.name')" />
        <el-table-column :label="t('contest.date')">
          <template #default="{ row }">
            {{ formatDate(row.openFrom) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('contest.status')">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)">
              {{ getStatus(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')">
          <template #default="{ row }">
            <el-button size="small" @click="manageContest(row.id)">
              {{ t('organizer.manage') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useOrganiserStore } from '@/stores/organiser'
import type { OrganiserContestDetails } from '@/types/api'

const { t } = useI18n()
const router = useRouter()
const store = useOrganiserStore()

onMounted(async () => {
  try {
    await store.loadOrganisations()
    await store.loadContests()
  } catch (e: any) {
    ElMessage.error(e.message ?? t('organizer.loadError'))
  }
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

function getStatus(contest: OrganiserContestDetails): string {
  const now = new Date()
  const openFrom = new Date(contest.openFrom)
  const openTo = new Date(contest.openTo)
  if (now < openFrom) return t('contest.status.upcoming')
  if (now > openTo) return t('contest.status.closed')
  return t('contest.status.open')
}

function getStatusType(contest: OrganiserContestDetails): 'success' | 'warning' | 'info' {
  const status = getStatus(contest)
  if (status === 'closed') return 'info'
  if (status === 'open') return 'success'
  return 'warning'
}

function createContest() {
  // TODO: Navigate to contest creation form
  ElMessage.info(t('organizer.createContestHint'))
}

function manageContest(id: string) {
  router.push(`/organizer/contest/${id}`)
}
</script>

<style scoped>
.organizer-dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.contests-list {
  margin-top: 20px;
}
</style>