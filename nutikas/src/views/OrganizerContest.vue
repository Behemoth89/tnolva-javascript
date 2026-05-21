<template>
  <div class="organizer-contest">
    <template v-if="isNewContest">
      <div class="new-contest-header">
        <h2>Create Contest</h2>
      </div>
      <ContestForm ref="contestFormRef" @saved="onContestCreated" />
    </template>
    <template v-else>
    <div class="contest-header">
      <el-button @click="_goBack">Back</el-button>
      <h2>{{ contest?.name ?? 'Contest' }}</h2>
      <el-button type="primary" @click="_editContest">Edit</el-button>
    </div>

    <el-tabs v-model="activeTab" class="contest-tabs">
      <!-- Classes Tab -->
      <el-tab-pane label="Classes" name="classes">
        <div class="tab-toolbar">
          <el-button type="primary" @click="addClass">Add Class</el-button>
        </div>
        <el-table :data="classes" stripe>
          <el-table-column prop="name" label="Name" />
          <el-table-column label="Duration">
            <template #default="{ row }">
              {{ formatDuration(row.duration) }}
            </template>
          </el-table-column>
          <el-table-column label="Max Duration">
            <template #default="{ row }">
              {{ formatDuration(row.maxDuration) }}
            </template>
          </el-table-column>
          <el-table-column label="Penalty">
            <template #default="{ row }">
              {{ row.overDurationPenalty }}/{{ row.overDurationUnit }}sec
            </template>
          </el-table-column>
          <el-table-column label="Actions">
            <template #default="{ row }">
              <el-button size="small" @click="editClass(row)">Edit</el-button>
              <el-button size="small" type="danger" @click="deleteClass(row.id)">Delete</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Checkpoints Tab -->
      <el-tab-pane label="Checkpoints" name="checkpoints">
        <div class="tab-toolbar">
          <el-button type="primary" @click="addCheckpoint">Add Checkpoint</el-button>
          <el-button @click="printQrs">Print QR Codes</el-button>
        </div>
        <el-table :data="checkpoints" stripe>
          <el-table-column prop="cpid" label="CPID" width="120" />
          <el-table-column prop="cpCode" label="Code" />
          <el-table-column label="Type">
            <template #default="{ row }">
              {{ getCheckpointTypeLabel(row.checkPointType) }}
            </template>
          </el-table-column>
          <el-table-column prop="score" label="Score" />
          <el-table-column label="Actions">
            <template #default="{ row }">
              <el-button size="small" @click="editCheckpoint(row)">Edit</el-button>
              <el-button size="small" type="danger" @click="deleteCheckpoint(row.id)">Delete</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Teams Tab -->
      <el-tab-pane label="Teams" name="teams">
        <div class="tab-toolbar">
          <el-button type="primary" @click="addTeam">Add Team</el-button>
        </div>
        <el-table :data="teams" stripe>
          <el-table-column prop="name" label="Name" />
          <el-table-column prop="score" label="Score" />
          <el-table-column prop="finalScore" label="Final Score" />
          <el-table-column label="Actions">
            <template #default="{ row }">
              <el-button size="small" @click="editTeam(row)">Edit</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Markings Tab -->
      <el-tab-pane label="Markings" name="markings">
        <div class="tab-toolbar">
          <el-button type="primary" @click="addMarking">Add Marking</el-button>
          <el-button @click="openLiveMarkings">Live View</el-button>
        </div>
        <el-table :data="markings.items" stripe>
          <el-table-column prop="teamName" label="Team" />
          <el-table-column prop="cpCode" label="CP" />
          <el-table-column prop="score" label="Score" />
          <el-table-column label="Time">
            <template #default="{ row }">
              {{ formatDateTime(row.dt) }}
            </template>
          </el-table-column>
          <el-table-column label="Actions">
            <template #default="{ row }">
              <el-button size="small" @click="editMarking(row)">Edit</el-button>
              <el-button size="small" type="danger" @click="deleteMarking(row.id)">Delete</el-button>
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

    <ContestForm v-if="!isNewContest" ref="contestFormRef" :contest="contest" @saved="loadContest" />
    <ClassForm ref="classFormRef" :contest-id="contestId" @saved="loadClasses" />
    <CheckpointForm ref="checkpointFormRef" :contest-id="contestId" :checkpoint="selectedCheckpoint" @saved="onCheckpointSaved" />
    <TeamForm ref="teamFormRef" :contest-id="contestId" :classes="classes" @saved="loadTeams" />
    <MarkingForm ref="markingFormRef" :contest-id="contestId" :teams="teams" :checkpoints="checkpoints" @saved="loadMarkings" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { organiserApi } from '@/api/endpoints/organiser'
import type {
  OrganiserContestDetails,
  OrganiserContestClassDetails,
  OrganiserCheckPointDetails,
  OrganiserTeamDetails,
  OrganiserMarkingListItem,
  PagedResponse
} from '@/types/api'
import { ECheckPointType } from '@/types/api'
import ContestForm from '@/components/Organizer/ContestForm.vue'
import ClassForm from '@/components/Organizer/ClassForm.vue'
import CheckpointForm from '@/components/Organizer/CheckpointForm.vue'
import TeamForm from '@/components/Organizer/TeamForm.vue'
import MarkingForm from '@/components/Organizer/MarkingForm.vue'

const route = useRoute()
const router = useRouter()

const contest = ref<OrganiserContestDetails | null>(null)
const classes = ref<OrganiserContestClassDetails[]>([])
const checkpoints = ref<OrganiserCheckPointDetails[]>([])
const teams = ref<OrganiserTeamDetails[]>([])
const markings = ref<PagedResponse<OrganiserMarkingListItem>>({ items: [], page: 1, pageSize: 25, totalCount: 0, totalPages: 0 })
const markingsPage = ref(1)
const activeTab = ref('classes')

const contestFormRef = ref<InstanceType<typeof ContestForm> | null>(null)
const classFormRef = ref<InstanceType<typeof ClassForm> | null>(null)
const checkpointFormRef = ref<InstanceType<typeof CheckpointForm> | null>(null)
const teamFormRef = ref<InstanceType<typeof TeamForm> | null>(null)
const markingFormRef = ref<InstanceType<typeof MarkingForm> | null>(null)

const selectedCheckpoint = ref<OrganiserCheckPointDetails | undefined>(undefined)

const contestId = computed(() => route.params.id as string)
const isNewContest = computed(() => contestId.value === 'new')

onMounted(async () => {
  if (isNewContest.value) return
  await Promise.all([loadContest(), loadClasses(), loadCheckpoints(), loadTeams(), loadMarkings()])
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

function onContestCreated() {
  router.push('/organizer')
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getCheckpointTypeLabel(type: ECheckPointType): string {
  const labels: Record<number, string> = {
    [ECheckPointType.Regular]: 'Regular',
    [ECheckPointType.Finish]: 'Finish',
    [ECheckPointType.Start]: 'Start',
    [ECheckPointType.NoScore]: 'No Score'
  }
  return labels[type] ?? type.toString()
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function _goBack() {
  router.push('/organizer')
}

function _editContest() {
  contestFormRef.value?.open()
}

function addClass() {
  classFormRef.value?.open()
}

function editClass(cls: OrganiserContestClassDetails) {
  classFormRef.value?.open(cls)
}

async function deleteClass(id: string) {
  await ElMessageBox.confirm('Delete this class?')
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
  await ElMessageBox.confirm('Delete this checkpoint?')
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
  await ElMessageBox.confirm('Delete this marking?')
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

.new-contest-header {
  padding: 20px 0;
}
</style>