<script setup lang="ts">
import { ref } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'
import { useRaceStore } from '@/stores/race'
import { useToast } from '@/composables/useToast'
import he from 'he'

const props = defineProps<{
  contestId: string
  userTeamId: string
}>()

const emit = defineEmits<{
  'scan-success': [checkPointId: string, displayCPId: string]
  'scan-error': [message: string]
  'camera-error': [message: string]
}>()

const raceStore = useRaceStore()
const toast = useToast()

// Internal state
const pause = ref(false)
const manualInput = ref('')
const isSubmitting = ref(false)

/**
 * Handle a detected or manually-entered CP ID
 */
async function handleCPId(cpId: string): Promise<void> {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    // Decode Estonian characters for display (e.g. "&Auml;" -> "Ä")
    const displayCPId = he.decode(cpId)

    const result = await raceStore.submitScan(cpId, props.userTeamId)

    if (result.isAlreadyScanned) {
      // D-15: Re-scanned CPs show "Already scanned" toast, not error
      toast.info('Already scanned')
    } else if (!result.statusOk) {
      const msg = result.message || 'Scan failed'
      toast.error(msg)
      emit('scan-error', msg)
    } else {
      toast.success(`Scanned: ${displayCPId}`)
      emit('scan-success', cpId, displayCPId)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Scan failed'
    toast.error(msg)
    emit('scan-error', msg)
  } finally {
    isSubmitting.value = false
    // Pause scanner to prevent rapid re-scanning
    pause.value = true
    setTimeout(() => {
      pause.value = false
    }, 2000)
  }
}

/**
 * Handle QR code detection from camera
 */
async function onDetect(detectedCodes: { rawValue: string }[]): Promise<void> {
  if (pause.value || detectedCodes.length === 0) return

  const cpId = detectedCodes[0].rawValue
  await handleCPId(cpId)
}

/**
 * Handle camera errors with human-readable messages
 */
function onCameraError(error: Error): void {
  const err = error as EmittedError

  switch (err.name) {
    case 'NotAllowedError':
      toast.error('Camera permission denied')
      emit('camera-error', 'Camera permission denied')
      break
    case 'NotFoundError':
      toast.error('No camera found')
      emit('camera-error', 'No camera found')
      break
    case 'InsecureContextError':
      toast.error('HTTPS required for camera')
      emit('camera-error', 'HTTPS required for camera')
      break
    case 'StreamApiNotSupportedError':
      toast.error('Camera not supported in this browser')
      emit('camera-error', 'Camera not supported in this browser')
      break
    default:
      toast.error(`Camera error: ${err.message}`)
      emit('camera-error', err.message)
  }
}

interface EmittedError {
  name: string
  message: string
}

/**
 * Handle manual entry form submission
 * Note: Enter key does NOT submit - separate button required (D-06)
 */
function handleManualSubmit(): void {
  const trimmed = manualInput.value.trim()
  if (!trimmed) return

  // Convert to uppercase for consistency
  const uppercased = trimmed.toUpperCase()
  handleCPId(uppercased)

  // Clear input after submit
  manualInput.value = ''
}
</script>

<template>
  <div class="race-scanner">
    <!-- Camera scanner section -->
    <div class="scanner-section">
      <QrcodeStream
        :paused="pause"
        :constraints="{ facingMode: 'environment' }"
        @detect="onDetect"
        @error="onCameraError"
      />

      <!-- Scanning overlay when paused -->
      <div v-if="pause" class="scanning-overlay">
        <span class="scanning-text">Scanning...</span>
      </div>
    </div>

    <!-- Manual entry section - always visible below camera -->
    <div class="manual-entry">
      <input
        v-model="manualInput"
        type="text"
        placeholder="e.g. OPEN-CP-1"
        class="manual-input"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="characters"
        @keydown.enter.prevent
      />
      <button
        class="submit-btn"
        @click="handleManualSubmit"
        :disabled="isSubmitting || !manualInput.trim()"
      >
        Submit
      </button>
    </div>
  </div>
</template>

<style scoped>
.race-scanner {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1rem;
}

.scanner-section {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.scanner-section :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanning-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.scanning-text {
  color: white;
  font-size: 1.125rem;
  font-weight: 500;
}

.manual-entry {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.manual-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  background: white;
}

.manual-input:focus {
  outline: none;
  border-color: #1976d2;
}

.manual-input::placeholder {
  color: #999;
}

.submit-btn {
  padding: 0.75rem 1.25rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.submit-btn:disabled {
  background: #90caf9;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  background: #1565c0;
}
</style>