<template>
  <el-dialog v-model="visible" :title="isEdit ? 'Edit Checkpoint' : 'Add Checkpoint'" width="600px">
    <el-form :model="form" label-width="140px">
      <el-form-item label="CPID" required>
        <el-input v-model="form.cpid" :disabled="isEdit" />
        <span class="form-hint">Unique checkpoint identifier</span>
      </el-form-item>
      <el-form-item label="Code" required>
        <el-input v-model="form.cpCode" />
      </el-form-item>
      <el-form-item label="Type" required>
        <el-select v-model="form.checkPointType">
          <el-option :value="1" label="Regular" />
          <el-option :value="2" label="Finish" />
          <el-option :value="3" label="Start" />
          <el-option :value="4" label="No Score" />
        </el-select>
      </el-form-item>
      <el-form-item label="Score">
        <el-input-number v-model="form.score" :min="0" />
      </el-form-item>
      <el-form-item label="Latitude">
        <el-input-number v-model="form.lat" :precision="6" />
      </el-form-item>
      <el-form-item label="Longitude">
        <el-input-number v-model="form.lon" :precision="6" />
      </el-form-item>
      <el-form-item v-if="form.cpid">
        <div class="qr-preview">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" />
          <span>{{ form.cpid }}</span>
        </div>
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

const { generateQrDataUrl } = useQrCode()
const visible = ref(false)
const isEdit = computed(() => !!props.checkpoint)
const qrDataUrl = ref<string>('')

const form = ref<OrganiserCheckPointUpsertRequest>({
  cpid: '',
  cpCode: '',
  checkPointType: ECheckPointType.Regular,
  score: 10,
  lat: null,
  lon: null
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
      lat: null,
      lon: null
    }
    qrDataUrl.value = ''
  }
  visible.value = true
}

async function submit() {
  try {
    const data: any = { ...form.value }
    data.score = Number(data.score)
    if (isEdit.value && props.checkpoint) {
      await organiserApi.updateCheckpoint(props.checkpoint.id, data)
    } else {
      await organiserApi.createCheckpoint(props.contestId, data)
    }
    emit('saved')
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message ?? 'Save failed')
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