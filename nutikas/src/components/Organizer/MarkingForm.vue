<template>
  <el-dialog v-model="visible" :title="isEdit ? t('organizer.editMarking') : t('organizer.addMarking')">
    <el-form :model="form" label-width="140px">
      <el-form-item :label="t('marking.team')" required>
        <el-select v-model="form.teamId" @change="loadTeamCheckpoints">
          <el-option v-for="team in teams" :key="team.id" :value="team.id" :label="team.name" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('marking.checkpoint')" required>
        <el-select v-model="form.checkPointId" placeholder="Select checkpoint">
          <el-option
            v-for="cp in availableCheckpoints"
            :key="cp.id"
            :value="cp.id"
            :label="`${cp.cpCode} (${cp.cpid})`"
          />
        </el-select>
        <span class="form-hint">{{ t('marking.checkpointGuidHint') }}</span>
      </el-form-item>
      <el-form-item :label="t('marking.dt')">
        <el-date-picker v-model="form.dt" type="datetime" />
      </el-form-item>
      <el-form-item :label="t('marking.lat')">
        <el-input-number v-model="form.lat" :precision="6" />
      </el-form-item>
      <el-form-item :label="t('marking.lon')">
        <el-input-number v-model="form.lon" :precision="6" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="submit">{{ t('common.submit') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { OrganiserTeamDetails, OrganiserCheckPointDetails, OrganiserMarkingCreateRequest, OrganiserMarkingListItem } from '@/types/api'
import { organiserApi } from '@/api/endpoints/organiser'

const props = defineProps<{
  contestId: string
  teams: OrganiserTeamDetails[]
  checkpoints: OrganiserCheckPointDetails[]
}>()

const emit = defineEmits<{
  saved: []
}>()

const { t } = useI18n()
const visible = ref(false)
const isEdit = computed(() => false) // For now, only create mode
const availableCheckpoints = ref<OrganiserCheckPointDetails[]>([])

// Editing state
const editingMarking = ref<OrganiserMarkingListItem | null>(null)

const form = ref<OrganiserMarkingCreateRequest & { teamId: string }>({
  teamId: '',
  checkPointId: '',
  dt: '',
  lat: undefined,
  lon: undefined
})

function loadTeamCheckpoints(teamId: string) {
  // Filter checkpoints to show all (or filter by team's class)
  availableCheckpoints.value = props.checkpoints
}

function open(existingMarking?: OrganiserMarkingListItem) {
  if (existingMarking) {
    editingMarking.value = existingMarking
    form.value = {
      teamId: existingMarking.userTeamId,
      checkPointId: existingMarking.checkPointId,
      dt: existingMarking.dt,
      lat: existingMarking.lat,
      lon: existingMarking.lon
    }
    loadTeamCheckpoints(existingMarking.userTeamId)
  } else {
    editingMarking.value = null
    form.value = {
      teamId: '',
      checkPointId: '',
      dt: '',
      lat: undefined,
      lon: undefined
    }
    availableCheckpoints.value = props.checkpoints
  }
  visible.value = true
}

async function submit() {
  try {
    const { teamId, ...data } = form.value
    if (editingMarking.value) {
      // Update existing marking
      await organiserApi.updateMarking(editingMarking.value.id, {
        score: 0, // Would need to get score from form
        dt: data.dt,
        lat: data.lat,
        lon: data.lon
      })
    } else {
      // Create new marking
      const result = await organiserApi.createMarking(teamId, data as OrganiserMarkingCreateRequest)
      if (!result.statusOk) {
        ElMessage.warning(result.message)
        return
      }
    }
    emit('saved')
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message ?? t('common.saveError'))
  }
}

defineExpose({ open })
</script>

<style scoped>
.form-hint {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>