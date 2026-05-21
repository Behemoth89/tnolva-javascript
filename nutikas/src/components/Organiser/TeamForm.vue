<template>
  <el-dialog v-model="visible" :title="isEdit ? 'Edit Team' : 'Add Team'">
    <el-form :model="form" label-width="120px">
      <el-form-item label="Name" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="Class" required>
        <el-select v-model="form.contestClassId" placeholder="Select class">
          <el-option v-for="cls in classes" :key="cls.id" :value="cls.id" :label="cls.name">
            {{ cls.name }}
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Members (emails)">
        <el-input v-model="form.memberNames" placeholder="comma separated emails" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">Cancel</el-button>
      <el-button type="primary" @click="submit">Save</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { OrganiserTeamUpsertRequest, OrganiserTeamDetails, OrganiserContestClassDetails } from '@/types/api'
import { organiserApi } from '@/api/endpoints/organiser'

const props = defineProps<{
  contestId: string
  team?: OrganiserTeamDetails
  classes: OrganiserContestClassDetails[]
}>()

const emit = defineEmits<{
  saved: []
}>()

const visible = ref(false)
const isEdit = computed(() => !!props.team)

const form = ref<OrganiserTeamUpsertRequest>({
  name: '',
  memberNames: '',
  contestClassId: ''
})

watch(() => props.team, (team) => {
  if (team) {
    form.value = { 
      name: team.name, 
      memberNames: '', 
      contestClassId: team.classId 
    }
  }
}, { immediate: true })

function open(existingTeam?: OrganiserTeamDetails) {
  if (existingTeam) {
    form.value = { 
      name: existingTeam.name, 
      memberNames: '', 
      contestClassId: existingTeam.classId 
    }
  } else {
    form.value = { name: '', memberNames: '', contestClassId: '' }
  }
  visible.value = true
}

async function submit() {
  try {
    const data: any = { ...form.value }
    if (!data.contestClassId) delete data.contestClassId
    if (isEdit.value && props.team) {
      await organiserApi.updateTeam(props.team.id, data)
    } else {
      await organiserApi.createTeam(props.contestId, data)
    }
    emit('saved')
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message ?? 'Save failed')
  }
}

defineExpose({ open })
</script>