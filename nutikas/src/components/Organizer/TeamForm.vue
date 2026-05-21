<template>
  <el-dialog v-model="visible" :title="isEdit ? t('organizer.editTeam') : t('organizer.addTeam')">
    <el-form :model="form" label-width="120px">
      <el-form-item :label="t('team.name')" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item :label="t('team.class')" required>
        <el-select v-model="form.classId" placeholder="Select class">
          <el-option v-for="cls in classes" :key="cls.id" :value="cls.id" :label="cls.name" />
        </el-select>
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

const { t } = useI18n()
const visible = ref(false)
const isEdit = computed(() => !!props.team)

const form = ref<OrganiserTeamUpsertRequest>({
  name: '',
  classId: '',
  members: []
})

watch(() => props.team, (team) => {
  if (team) form.value = { name: team.name, classId: team.classId, members: [] }
}, { immediate: true })

function open(existingTeam?: OrganiserTeamDetails) {
  if (existingTeam) {
    form.value = { name: existingTeam.name, classId: existingTeam.classId, members: [] }
  } else {
    form.value = { name: '', classId: '', members: [] }
  }
  visible.value = true
}

async function submit() {
  try {
    if (isEdit.value && props.team) {
      await organiserApi.updateTeam(props.team.id, form.value)
    } else {
      await organiserApi.createTeam(props.contestId, form.value)
    }
    emit('saved')
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message ?? t('common.saveError'))
  }
}

defineExpose({ open })
</script>