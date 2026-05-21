<template>
  <el-dialog v-model="visible" :title="isEdit ? 'Edit Contest' : 'Create Contest'" width="600px">
    <el-form :model="form" label-width="140px">
      <el-form-item label="Name" required>
        <el-input v-model="form.name" />
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
import type { OrganiserContestUpsertRequest, OrganiserContestDetails } from '@/types/api'
import { organiserApi } from '@/api/endpoints/organiser'

const auth = useAuthStore()
const visible = ref(false)
const isEdit = computed(() => !!props.contest)

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

async function submit() {
  try {
    if (isEdit.value && props.contest) {
      await organiserApi.updateContest(props.contest.id, form.value)
    } else {
      await organiserApi.createContest(form.value)
    }
    emit('saved')
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message ?? 'Save failed')
  }
}

defineExpose({ open })
</script>