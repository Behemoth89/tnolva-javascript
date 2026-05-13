<script setup lang="ts">
import { reactive, ref } from 'vue'
import { registerTeam } from '@/api/team'
import type { TeamRegistrationRequest } from '@/types/team'
import { ElMessage } from 'element-plus'

interface ContestClass {
  id: string
  name: string | null
  duration: number
}

const props = defineProps<{
  show: boolean
  contestId: string
  contestClasses: ContestClass[]
}>()

const emit = defineEmits<{
  close: []
}>()

const form = reactive({
  teamName: '',
  teamMembers: '',
  contestClassId: ''
})

const errors = reactive({
  teamName: '',
  teamMembers: '',
  contestClassId: ''
})

const loading = ref(false)

function formatDuration(minutes: number): string {
  return `${minutes} min`
}

function validate(): boolean {
  let valid = true
  errors.teamName = ''
  errors.teamMembers = ''
  errors.contestClassId = ''

  if (!form.teamName.trim()) {
    errors.teamName = 'Team name is required'
    valid = false
  }

  if (!form.teamMembers.trim()) {
    errors.teamMembers = 'At least one team member is required'
    valid = false
  }

  if (!form.contestClassId) {
    errors.contestClassId = 'Please select a class'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true

  const request: TeamRegistrationRequest = {
    teamName: form.teamName.trim(),
    teamMembers: form.teamMembers.trim(),
    contestClassId: form.contestClassId
  }

  try {
    await registerTeam(props.contestId, request)
    ElMessage.success('Team registered successfully!')
    close()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to register team'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

function close() {
  form.teamName = ''
  form.teamMembers = ''
  form.contestClassId = ''
  errors.teamName = ''
  errors.teamMembers = ''
  errors.contestClassId = ''
  emit('close')
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <header class="modal-header">
        <h2>Register Team</h2>
        <button class="close-btn" @click="close" aria-label="Close">×</button>
      </header>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label for="teamName">Team Name</label>
          <input
            id="teamName"
            v-model="form.teamName"
            type="text"
            placeholder="Enter team name"
            maxlength="128"
          />
          <span v-if="errors.teamName" class="error">{{ errors.teamName }}</span>
        </div>

        <div class="form-group">
          <label for="teamMembers">Team Members</label>
          <input
            id="teamMembers"
            v-model="form.teamMembers"
            type="text"
            placeholder="John, Jane, Bob"
            maxlength="255"
          />
          <span v-if="errors.teamMembers" class="error">{{ errors.teamMembers }}</span>
        </div>

        <div class="form-group">
          <label>Contest Class</label>
          <div class="radio-group">
            <label
              v-for="cls in contestClasses"
              :key="cls.id"
              class="radio-option"
            >
              <input
                type="radio"
                :value="cls.id"
                v-model="form.contestClassId"
              />
              <span class="radio-label">
                {{ cls.name || 'Unnamed Class' }}
                ({{ formatDuration(cls.duration) }})
              </span>
            </label>
          </div>
          <span v-if="errors.contestClassId" class="error">{{ errors.contestClassId }}</span>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Registering...' : 'Register' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="close">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  line-height: 1;
}

.modal-form {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.radio-option:has(input:checked) {
  border-color: #1976d2;
  background: #f0f7ff;
}

.radio-label {
  flex: 1;
}

.error {
  color: #d32f2f;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn {
  flex: 1;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:disabled {
  background: #90caf9;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}
</style>