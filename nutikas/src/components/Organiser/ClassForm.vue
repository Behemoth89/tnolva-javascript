<template>
  <el-dialog v-model="visible" :title="isEdit ? 'Edit Class' : 'Add Class'">
    <el-form :model="form" label-width="160px">
      <el-form-item label="Name" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="Order">
        <el-input-number v-model="form.orderNr" :min="0" />
      </el-form-item>
      <el-form-item label="Duration (sec)" required>
        <el-input-number v-model="form.duration" :min="60" :step="60" />
      </el-form-item>
      <el-form-item label="Max Duration (sec)" required>
        <el-input-number v-model="form.maxDuration" :min="60" :step="60" />
      </el-form-item>
      <el-form-item label="Penalty Unit (sec)">
        <el-input-number v-model="form.overDurationUnit" :min="60" :step="60" />
      </el-form-item>
      <el-form-item label="Penalty Per Unit">
        <el-input-number v-model="form.overDurationPenalty" :min="0" />
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
import type { OrganiserContestClassUpsertRequest, OrganiserContestClassDetails } from '@/types/api'
import { organiserApi } from '@/api/endpoints/organiser'

const props = defineProps<{
  contestId: string
  classItem?: OrganiserContestClassDetails
}>()

const emit = defineEmits<{
  saved: []
}>()

const visible = ref(false)
const isEdit = computed(() => !!props.classItem)

const form = ref<OrganiserContestClassUpsertRequest>({
  name: '',
  orderNr: 0,
  duration: 3600,
  maxDuration: 5400,
  overDurationUnit: 60,
  overDurationPenalty: 0
})

watch(() => props.classItem, (c) => {
  if (c) form.value = { ...c }
}, { immediate: true })

function open(existingClass?: OrganiserContestClassDetails) {
  if (existingClass) {
    form.value = { ...existingClass }
  } else {
    form.value = {
      name: '',
      orderNr: 0,
      duration: 3600,
      maxDuration: 5400,
      overDurationUnit: 60,
      overDurationPenalty: 0
    }
  }
  visible.value = true
}

async function submit() {
  try {
    if (isEdit.value && props.classItem) {
      await organiserApi.updateClass(props.classItem.id, form.value)
    } else {
      await organiserApi.createClass(props.contestId, form.value)
    }
    emit('saved')
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message ?? 'Save failed')
  }
}

defineExpose({ open })
</script>