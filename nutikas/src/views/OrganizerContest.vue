<template>
  <div class="organizer-contest">
    <div class="contest-header">
      <el-button @click="goBack">{{ t('common.back') }}</el-button>
      <h2>{{ contest?.name ?? t('organizer.contest') }}</h2>
      <el-button type="primary" @click="editContest">{{ t('organizer.edit') }}</el-button>
    </div>

    <el-tabs v-model="activeTab" class="contest-tabs">
      <!-- Classes Tab -->
      <el-tab-pane :label="t('organizer.classes')" name="classes">
        <div class="tab-toolbar">
          <el-button type="primary" @click="addClass">{{ t('organizer.addClass') }}</el-button>
        </div>
        <el-table :data="classes" stripe>
          <el-table-column prop="name" :label="t('class.name')" />
          <el-table-column :label="t('class.duration')">
            <template #default="{ row }">
              {{ formatDuration(row.duration) }}
            </template>
          </el-table-column>
          <el-table-column :label="t('class.maxDuration')">
            <template #default="{ row }">
              {{ formatDuration(row.maxDuration) }}
            </template>
          </el-table-column>
          <el-table-column :label="t('class.penalty')">
            <template #default="{ row }">
              {{ row.overDurationPenalty }}/{{ row.overDurationUnit }}{{ t('class.seconds') }}
            </template>
          </el-table-column>
          <el-table-column :label="t('common.actions')">
            <template #default="{ row }">
              <el-button size="small" @click="editClass(row)">{{ t('common.edit') }}</el-button>
              <el-button size="small" type="danger" @click="deleteClass(row.id)">{{ t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Checkpoints Tab -->
      <el-tab-pane :label="t('organizer.checkpoints')" name="checkpoints">
        <div class="tab-toolbar">
          <el-button type="primary" @click="addCheckpoint">{{ t('organizer.addCheckpoint') }}</el-button>
          <el-button @click="printQrs">{{ t('organizer.printQrs') }}</el-button>
        </div>
        <el-table :data="checkpoints" stripe>
          <el-table-column prop="cpid" :label="t('checkpoint.cpid')" width="120" />
          <el-table-column prop="cpCode" :label="t('checkpoint.cpCode')" />
          <el-table-column :label="t('checkpoint.type')">
            <template #default="{ row }">
              {{ getCheckpointTypeLabel(row.checkPointType) }}
            </template>
          </el-table-column>
          <el-table-column prop="score" :label="t('checkpoint.score')" />
          <el-table-column :label="t('common.actions')">
            <template #default="{ row }">
              <el-button size="small" @click="editCheckpoint(row)">{{ t('common.edit') }}</el-button>
              <el-button size="small" type="danger" @click="deleteCheckpoint(row.id)">{{ t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Teams Tab -->
      <el-tab-pane :label="t('organizer.teams')" name="teams">
        <div class="tab-toolbar">
          <el-button type="primary" @click="addTeam">{{ t('organizer.addTeam') }}</el-button>
        </div>
        <el-table :data="teams" stripe>
          <el-table-column prop="name" :label="t('team.name')" />
          <el-table-column prop="score" :label="t('team.score')" />
          <el-table-column prop="finalScore" :label="t('team.finalScore')" />
          <el-table-column :label="t('common.actions')">
            <template #default="{ row }">
              <el-button size="small" @click="editTeam(row)">{{ t('common.edit') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Markings Tab -->
      <el-tab-pane :label="t('organizer.markings')" name="markings">
        <div class="tab-toolbar">
          <el-button type="primary" @click="addMarking">{{ t('organizer.addMarking') }}</el-button>
          <el-button @click="openLiveMarkings">{{ t('organizer.liveView') }}</el-button>
        </div>
        <el-table :data="markings.items" stripe>
          <el-table-column prop="teamName" :label="t('marking.team')" />
          <el-table-column prop="cpCode" :label="t('marking.cp')" />
          <el-table-column prop="score" :label="t('marking.score')" />
          <el-table-column :label="t('marking.time')">
            <template #default="{ row }">
              {{ formatDateTime(row.dt) }}
            </template>
          </el-table-column>
          <el-table-column :label="t('common.actions')">
            <template #default="{ row }">
              <el-button size="small" @click="editMarking(row)">{{ t('common.edit') }}</el-button>
              <el-button size="small" type="danger" @click="deleteMarking(row.id)">{{ t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="markingsPage"
          :page-size="25"
          :total="markings.totalCount"
          layout="prev, pager, next"
          @current-change="loadMarkings"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- Form dialogs -->
    <ContestForm ref="contestFormRef" :contest="contest" @saved="loadContest" />
    <ClassForm ref="classFormRef" :contest-id="contestId" @saved="loadClasses" />
    <CheckpointForm ref="checkpointFormRef" :contest-id="contestId" :checkpoint="selectedCheckpoint" @saved="onCheckpointSaved" />
    <TeamForm ref="teamFormRef" :contest-id="contestId" :classes="classes" @saved="loadTeams" />
    <MarkingForm ref="markingFormRef" :contest-id="contestId" :teams="teams" :checkpoints="checkpoints" @saved="loadMarkings" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { organiserApi } from '@/api/endpoints/organiser'
import type {
  OrganiserContestDetails,
  OrganiserContestClassDetails,
  OrganiserCheckPointDetails,
  OrganiserTeamDetails,
  OrganiserMarkingListItem,
  PagedResponse,
  ECheckPointType
} from '@/types/api'
import ContestForm from '@/components/Organizer/ContestForm.vue'
import ClassForm from '@/components/Organizer/ClassForm.vue'
import CheckpointForm from '@/components/Organizer/CheckpointForm.vue'
import TeamForm from '@/components/Organizer/TeamForm.vue'
import MarkingForm from '@/components/Organizer/MarkingForm.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const contest = ref<OrganiserContestDetails | null>(null)
const classes = ref<OrganiserContestClassDetails[]>([])
const checkpoints = ref<OrganiserCheckPointDetails[]>([])
const teams = ref<OrganiserTeamDetails[]>([])
const markings = ref<PagedResponse<OrganiserMarkingListItem>>({ items: [], page: 1, pageSize: 25, totalCount: 0, totalPages: 0 })
const markingsPage = ref(1)
const activeTab = ref('classes')

// Form refs
const contestFormRef = ref<InstanceType<typeof ContestForm> | null>(null)
const classFormRef = ref<InstanceType<typeof ClassForm> | null>(null)
const checkpointFormRef = ref<InstanceType<typeof CheckpointForm> | null>(null)
const teamFormRef = ref<InstanceType<typeof TeamForm> | null>(null)
const markingFormRef = ref<InstanceType<typeof MarkingForm> | null>(null)

// Selected item for editing
const selectedCheckpoint = ref<OrganiserCheckPointDetails | undefined>(undefined)

const contestId = computed(() => route.params.id as string)

onMounted(async () => {
  await loadContest()
  await Promise.all([loadClasses(), loadCheckpoints(), loadTeams(), loadMarkings()])
})

async function loadContest() {
  contest.value = await organiserApi.getContest(contestId.value)
}

async function loadClasses() {
  classes.value = await organiserApi.getClasses(contestId.value)
}

async function loadCheckpoints() {
  checkpoints.value = await organiserApi.getCheckpoints(contestId.value)
}

async function loadTeams() {
  teams.value = await organiserApi.getTeams(contestId.value)
}

async function loadMarkings() {
  markings.value = await organiserApi.getMarkings(contestId.value, markingsPage.value, 25)
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getCheckpointTypeLabel(type: ECheckPointType): string {
  const labels: Record<number, string> = {
    [ECheckPointType.Regular]: t('checkpoint.type.regular'),
    [ECheckPointType.Finish]: t('checkpoint.type.finish'),
    [ECheckPointType.Start]: t('checkpoint.type.start'),
    [ECheckPointType.NoScore]: t('checkpoint.type.noscore')
  }
  return labels[type] ?? type.toString()
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function goBack() {
  router.push('/organizer')
}

function editContest() {
  contestFormRef.value?.open()
}

function addClass() {
  classFormRef.value?.open()
}

function editClass(cls: OrganiserContestClassDetails) {
  classFormRef.value?.open(cls)
}

async function deleteClass(id: string) {
  await ElMessageBox.confirm(t('organizer.confirmDeleteClass'))
  await organiserApi.deleteClass(id)
  await loadClasses()
}

function addCheckpoint() {
  selectedCheckpoint.value = undefined
  checkpointFormRef.value?.open()
}

function editCheckpoint(cp: OrganiserCheckPointDetails) {
  selectedCheckpoint.value = cp
  checkpointFormRef.value?.open(cp)
}

async function deleteCheckpoint(id: string) {
  await ElMessageBox.confirm(t('organizer.confirmDeleteCheckpoint'))
  await organiserApi.deleteCheckpoint(id)
  await loadCheckpoints()
}

function printQrs() {
  router.push(`/organizer/contest/${contestId.value}/print`)
}

function addTeam() {
  teamFormRef.value?.open()
}

function editTeam(team: OrganiserTeamDetails) {
  teamFormRef.value?.open(team)
}

function addMarking() {
  markingFormRef.value?.open()
}

function editMarking(marking: OrganiserMarkingListItem) {
  markingFormRef.value?.open(marking)
}

async function deleteMarking(id: string) {
  await ElMessageBox.confirm(t('organizer.confirmDeleteMarking'))
  await organiserApi.deleteMarking(id)
  await loadMarkings()
}

function onCheckpointSaved() {
  selectedCheckpoint.value = undefined
  loadCheckpoints()
}

function openLiveMarkings() {
  router.push(`/organizer/contest/${contestId.value}/markings`)
}
</script>

<style scoped>
.organizer-contest {
  padding: 20px;
}

.contest-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.contest-header h2 {
  flex: 1;
  margin: 0;
}

.tab-toolbar {
  margin-bottom: 15px;
}
</style>