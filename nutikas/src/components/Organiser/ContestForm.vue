<template>
  <el-dialog v-model="visible" :title="isEdit ? 'Edit Contest' : 'Create Contest'" width="600px">
    <el-form :model="form" label-width="140px">
      <el-form-item label="Name" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="Organisation" required>
        <el-select v-model="form.organisationId" placeholder="Select organisation">
          <el-option v-for="org in organisations" :key="org.id" :value="org.id" :label="org.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="Visible From" required>
        <el-date-picker v-model="form.visibleFrom" type="datetime" />
      </el-form-item>
      <el-form-item label="Open From" required>
        <el-date-picker v-model="form.openFrom" type="datetime" />
      </el-form-item>
      <el-form-item label="Open To" required>
        <el-date-picker v-model="form.openTo" type="datetime" />
      </el-form-item>
      <el-form-item label="Bonus Per Marking">
        <el-input-number v-model="form.bonusPerMarking" :min="0" />
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
import { useAuthStore } from '@/stores/auth'
import type { OrganiserContestUpsertRequest, OrganiserContestDetails, OrganisationItem } from '@/types/api'
import { organiserApi } from '@/api/endpoints/organiser'

const auth = useAuthStore()
const visible = ref(false)
const isEdit = computed(() => !!props.contest)
const organisations = ref<OrganisationItem[]>([])

const props = defineProps<{
  contest?: OrganiserContestDetails | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const form = ref<OrganiserContestUpsertRequest>({
  name: '',
  visibleFrom: '',
  openFrom: '',
  openTo: '',
  bonusTimeStart: null,
  bonusTimeEnd: null,
  bonusPerMarking: 0,
  organisationId: '',
  createdBy: ''
})

watch(() => props.contest, (c) => {
  if (c) {
    form.value = { ...c }
  }
}, { immediate: true })

function open(existingContest?: OrganiserContestDetails | null) {
  loadOrganisations()
  if (existingContest) {
    form.value = { ...existingContest }
  } else {
    form.value = {
      name: '',
      visibleFrom: '',
      openFrom: '',
      openTo: '',
      bonusTimeStart: null,
      bonusTimeEnd: null,
      bonusPerMarking: 0,
      organisationId: '',
      createdBy: auth.userId ?? ''
    }
  }
  visible.value = true
}

async function loadOrganisations() {
  try {
    organisations.value = await organiserApi.getOrganisations()
  } catch (e) {
    ElMessage.error('Failed to load organisations')
  }
}

async function submit() {
  try {
    const data: any = { ...form.value }
    if (!isEdit.value) {
      data.createdBy = auth.userId ?? ''
    }
    // Format dates for API
    if (data.visibleFrom instanceof Date) data.visibleFrom = data.visibleFrom.toISOString()
    if (data.openFrom instanceof Date) data.openFrom = data.openFrom.toISOString()
    if (data.openTo instanceof Date) data.openTo = data.openTo.toISOString()
    
    if (isEdit.value && props.contest) {
      await organiserApi.updateContest(props.contest.id, data)
    } else {
      await organiserApi.createContest(data)
    }
    emit('saved')
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message ?? 'Save failed')
  }
}

defineExpose({ open })
</script>