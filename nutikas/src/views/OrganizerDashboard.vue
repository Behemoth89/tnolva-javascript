<template>
  <div class="organizer-dashboard">
    <div class="dashboard-header">
      <h1>Organizer Dashboard</h1>
      <el-button type="primary" @click="createContest">
        Create Contest
      </el-button>
    </div>

    <div v-if="store.isLoading" class="loading">
      Loading...
    </div>

    <el-alert v-if="store.error" type="error" :title="store.error" @close="store.clearError()" />

    <div v-else-if="myContests.length === 0" class="empty-state">
      <p>No contests yet</p>
      <el-button type="primary" @click="createContest">
        Create Your First Contest
      </el-button>
    </div>

    <div v-else class="contests-list">
      <el-table :data="myContests" stripe>
        <el-table-column prop="name" label="Name" />
        <el-table-column label="Date">
          <template #default="{ row }">
            {{ formatDate(row.openFrom) }}
          </template>
        </el-table-column>
        <el-table-column label="Status">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)">
              {{ getStatus(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions">
          <template #default="{ row }">
            <el-button size="small" @click="manageContest(row.id)">
              Manage
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useOrganiserStore } from '@/stores/organiser'
import type { OrganiserContestDetails } from '@/types/api'

const router = useRouter()
const store = useOrganiserStore()

const myContests = computed(() => store.myContests)

onMounted(async () => {
  try {
    await store.loadOrganisations()
    await store.loadContests()
  } catch (e: any) {
    ElMessage.error(e.message ?? 'Failed to load')
  }
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

function getStatus(contest: OrganiserContestDetails): string {
  const now = new Date()
  const openFrom = new Date(contest.openFrom)
  const openTo = new Date(contest.openTo)
  if (now < openFrom) return 'Upcoming'
  if (now > openTo) return 'Closed'
  return 'Open'
}

function getStatusType(contest: OrganiserContestDetails): 'success' | 'warning' | 'info' {
  const status = getStatus(contest)
  if (status === 'Closed') return 'info'
  if (status === 'Open') return 'success'
  return 'warning'
}

function createContest() {
  router.push('/organizer/contest/new')
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