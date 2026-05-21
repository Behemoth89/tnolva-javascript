<template>
  <el-dialog v-model="visible" :title="isEdit ? t('organizer.editCheckpoint') : t('organizer.addCheckpoint')" width="600px">
    <el-form :model="form" label-width="140px">
      <el-form-item :label="t('checkpoint.cpid')" required>
        <el-input v-model="form.cpid" :disabled="isEdit" />
        <span class="form-hint">{{ t('checkpoint.cpidHint') }}</span>
      </el-form-item>
      <el-form-item :label="t('checkpoint.cpCode')" required>
        <el-input v-model="form.cpCode" />
      </el-form-item>
      <el-form-item :label="t('checkpoint.type')" required>
        <el-select v-model="form.checkPointType">
          <el-option :value="1" :label="t('checkpoint.type.regular')" />
          <el-option :value="2" :label="t('checkpoint.type.finish')" />
          <el-option :value="3" :label="t('checkpoint.type.start')" />
          <el-option :value="4" :label="t('checkpoint.type.noscore')" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('checkpoint.score')">
        <el-input-number v-model="form.score" :min="0" />
      </el-form-item>
      <el-form-item :label="t('checkpoint.lat')">
        <el-input-number v-model="form.lat" :precision="6" />
      </el-form-item>
      <el-form-item :label="t('checkpoint.lon')">
        <el-input-number v-model="form.lon" :precision="6" />
      </el-form-item>
      <!-- QR Preview -->
      <el-form-item v-if="form.cpid">
        <div class="qr-preview">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" />
          <span>{{ form.cpid }}</span>
        </div>
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
import type { OrganiserCheckPointUpsertRequest, OrganiserCheckPointDetails } from '@/types/api'
import { organiserApi } from '@/api/endpoints/organiser'
import { useQrCode } from '@/composables/useQrCode'
import { ECheckPointType } from '@/types/api'

const props = defineProps<{
  contestId: string
  checkpoint?: OrganiserCheckPointDetails
}>()

const emit = defineEmits<{
  saved: []
}>()

const { t } = useI18n()
const { generateQrDataUrl } = useQrCode()
const visible = ref(false)
const isEdit = computed(() => !!props.checkpoint)
const qrDataUrl = ref<string>('')

const form = ref<OrganiserCheckPointUpsertRequest>({
  cpid: '',
  cpCode: '',
  checkPointType: ECheckPointType.Regular,
  score: 10,
  lat: 0,
  lon: 0
})

watch(() => props.checkpoint, (cp) => {
  if (cp) form.value = { ...cp }
}, { immediate: true })

watch(() => form.value.cpid, async (cpid) => {
  if (cpid) {
    qrDataUrl.value = await generateQrDataUrl(cpid)
  } else {
    qrDataUrl.value = ''
  }
})

function open(existingCheckpoint?: OrganiserCheckPointDetails) {
  if (existingCheckpoint) {
    form.value = { ...existingCheckpoint }
  } else {
    form.value = {
      cpid: '',
      cpCode: '',
      checkPointType: ECheckPointType.Regular,
      score: 10,
      lat: 0,
      lon: 0
    }
    qrDataUrl.value = ''
  }
  visible.value = true
}

async function submit() {
  try {
    if (isEdit.value && props.checkpoint) {
      await organiserApi.updateCheckpoint(props.checkpoint.id, form.value)
    } else {
      await organiserApi.createCheckpoint(props.contestId, form.value)
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

.qr-preview {
  text-align: center;
}

.qr-preview img {
  width: 150px;
  height: 150px;
}
</style>