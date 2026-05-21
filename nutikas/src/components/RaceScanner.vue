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
const scanResult = ref<{ success: boolean; message: string } | null>(null)

/**
 * Handle a detected or manually-entered CP ID
 */
async function handleCPId(cpId: string): Promise<void> {
  if (isSubmitting.value) return

  isSubmitting.value = true

  let lat: string | null = null
  let lon: string | null = null
  const dt = new Date().toISOString()

  // Get current location (always try since permission was requested at mount)
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
    })
    lat = position.coords.latitude.toFixed(6)
    lon = position.coords.longitude.toFixed(6)
  } catch {
    // Location not available - proceed without
  }

  try {
    const displayCPId = he.decode(cpId)

    const result = await raceStore.submitScan(cpId, props.userTeamId, { lat, lon, dt })

    if (result.isAlreadyScanned) {
      toast.info('Already scanned')
      scanResult.value = { success: true, message: 'Already scanned' }
    } else if (!result.statusOk) {
      const msg = result.message || 'Scan failed'
      toast.error(msg)
      emit('scan-error', msg)
      scanResult.value = { success: false, message: msg }
    } else {
      toast.success(`Scanned: ${displayCPId}`)
      emit('scan-success', cpId, displayCPId)
      scanResult.value = { success: true, message: `OK: ${displayCPId}` }
    }

    // Clear result after a delay
    setTimeout(() => {
      scanResult.value = null
    }, 2000)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Scan failed'
    toast.error(msg)
    emit('scan-error', msg)
  } finally {
    isSubmitting.value = false
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

      <!-- Scanning overlay when paused or showing result -->
      <div v-if="pause || scanResult" class="scanning-overlay" :class="{ 'result-overlay': scanResult }">
        <span v-if="scanResult" class="scan-result" :class="scanResult.success ? 'success' : 'error'">
          {{ scanResult.success ? '✓' : '✗' }}
          <span class="result-message">{{ scanResult.message }}</span>
        </span>
        <span v-else class="scanning-text">Scanning...</span>
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

.result-overlay {
  background: rgba(0, 0, 0, 0.7);
}

.scan-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 3rem;
  font-weight: 700;
}

.scan-result.success {
  color: #4caf50;
}

.scan-result.error {
  color: #f44336;
}

.result-message {
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  padding: 0 1rem;
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