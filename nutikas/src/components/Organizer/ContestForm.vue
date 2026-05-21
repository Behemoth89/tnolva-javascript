<template>
  <el-dialog v-model="visible" :title="isEdit ? t('organizer.editContest') : t('organizer.createContest')" width="600px">
    <el-form :model="form" label-width="140px">
      <el-form-item :label="t('contest.name')" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item :label="t('contest.visibleFrom')" required>
        <el-date-picker v-model="form.visibleFrom" type="datetime" />
      </el-form-item>
      <el-form-item :label="t('contest.openFrom')" required>
        <el-date-picker v-model="form.openFrom" type="datetime" />
      </el-form-item>
      <el-form-item :label="t('contest.openTo')" required>
        <el-date-picker v-model="form.openTo" type="datetime" />
      </el-form-item>
      <el-form-item :label="t('contest.bonusPerMarking')">
        <el-input-number v-model="form.bonusPerMarking" :min="0" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="submit">{{ t('common.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { OrganiserContestUpsertRequest, OrganiserContestDetails } from '@/types/api'
import { organiserApi } from '@/api/endpoints/organiser'

const props = defineProps<{
  contest?: OrganiserContestDetails | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const { t } = useI18n()
const visible = ref(false)
const isEdit = computed(() => !!props.contest)

const form = ref<OrganiserContestUpsertRequest>({
  name: '',
  visibleFrom: '',
  openFrom: '',
  openTo: '',
  bonusTimeStart: null,
  bonusTimeEnd: null,
  bonusPerMarking: 0,
  organisationId: ''
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
      organisationId: ''
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
    ElMessage.error(e.message ?? t('common.saveError'))
  }
}

defineExpose({ open })
</script>