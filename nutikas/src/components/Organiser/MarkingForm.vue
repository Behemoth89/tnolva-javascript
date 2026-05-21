<template>
  <el-dialog v-model="visible" :title="isEdit ? 'Edit Marking' : 'Add Marking'">
    <el-form :model="form" label-width="140px">
      <el-form-item label="Team" required>
        <el-select v-model="form.teamId" @change="loadTeamCheckpoints" placeholder="Select team">
          <el-option v-for="team in teams" :key="team.id" :value="team.id" :label="team.name">
            {{ team.name }}
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Checkpoint" required>
        <el-select v-model="form.checkPointId" placeholder="Select checkpoint">
          <el-option
            v-for="cp in availableCheckpoints"
            :key="cp.id"
            :value="cp.id"
            :label="`${cp.cpCode} (${cp.cpid})`"
          >
            {{ cp.cpCode }} ({{ cp.cpid }})
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Time">
        <el-date-picker v-model="form.dt" type="datetime" />
      </el-form-item>
      <el-form-item label="Latitude">
        <el-input v-model="form.lat" />
      </el-form-item>
      <el-form-item label="Longitude">
        <el-input v-model="form.lon" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">Cancel</el-button>
      <el-button type="primary" @click="submit">Submit</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { OrganiserTeamDetails, OrganiserCheckPointDetails, OrganiserMarkingListItem } from '@/types/api'
import { organiserApi } from '@/api/endpoints/organiser'

const props = defineProps<{
  contestId: string
  teams: OrganiserTeamDetails[]
  checkpoints: OrganiserCheckPointDetails[]
}>()

const emit = defineEmits<{
  saved: []
}>()

const visible = ref(false)
const isEdit = computed(() => false)
const availableCheckpoints = ref<OrganiserCheckPointDetails[]>([])
const editingMarking = ref<OrganiserMarkingListItem | null>(null)

const form = ref({
  teamId: '',
  checkPointId: '',
  dt: '',
  lat: '',
  lon: ''
})

function loadTeamCheckpoints(_teamId: string) {
  availableCheckpoints.value = props.checkpoints
}

function open(existingMarking?: OrganiserMarkingListItem) {
  if (existingMarking) {
    editingMarking.value = existingMarking
    form.value = {
      teamId: existingMarking.userTeamId,
      checkPointId: existingMarking.checkPointId,
      dt: existingMarking.dt,
      lat: existingMarking.lat ?? '',
      lon: existingMarking.lon ?? ''
    }
    loadTeamCheckpoints(existingMarking.userTeamId)
  } else {
    editingMarking.value = null
    form.value = {
      teamId: '',
      checkPointId: '',
      dt: '',
      lat: '',
      lon: ''
    }
    availableCheckpoints.value = props.checkpoints
  }
  visible.value = true
}

async function submit() {
  try {
    const data: any = {
      checkPointId: form.value.checkPointId,
      dt: form.value.dt ? new Date(form.value.dt).toISOString() : null,
      lat: form.value.lat || null,
      lon: form.value.lon || null
    }
    if (editingMarking.value) {
      await organiserApi.updateMarking(editingMarking.value.id, {
        dt: data.dt,
        lat: data.lat,
        lon: data.lon
      })
    } else {
      const result = await organiserApi.createMarking(form.value.teamId, data)
      if (!result.statusOk) {
        ElMessage.warning(result.message)
        return
      }
    }
    emit('saved')
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message ?? 'Save failed')
  }
}

defineExpose({ open })
</script>