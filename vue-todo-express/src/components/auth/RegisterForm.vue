<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RegisterData } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form data
const formData = ref<RegisterData>({
  email: '',
  password: '',
  passwordConfirm: '',
  firstName: '',
  lastName: '',
})

// Validation errors
const errors = ref<Record<string, string>>({})

// Password validation rules
const passwordRules = {
  minLength: (v: string) => v.length >= 8 || 'Password must be at least 8 characters',
  uppercase: (v: string) =>
    /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
  lowercase: (v: string) =>
    /[a-z]/.test(v) || 'Password must contain at least one lowercase letter',
  number: (v: string) => /[0-9]/.test(v) || 'Password must contain at least one number',
}

// Validate password
function validatePassword(): boolean {
  const password = formData.value.password
  const rules = [
    passwordRules.minLength,
    passwordRules.uppercase,
    passwordRules.lowercase,
    passwordRules.number,
  ]

  for (const rule of rules) {
    if (!rule(password)) {
      return false
    }
  }
  return true
}

// Validate form
function validate(): boolean {
  errors.value = {}

  // Email validation
  if (!formData.value.email) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    errors.value.email = 'Please enter a valid email address'
  }

  // Password validation
  if (!formData.value.password) {
    errors.value.password = 'Password is required'
  } else if (!validatePassword()) {
    errors.value.password =
      'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number'
  }

  // Password confirmation
  if (!formData.value.passwordConfirm) {
    errors.value.passwordConfirm = 'Please confirm your password'
  } else if (formData.value.password !== formData.value.passwordConfirm) {
    errors.value.passwordConfirm = 'Passwords do not match'
  }

  return Object.keys(errors.value).length === 0
}

// Handle submit
async function handleSubmit(): Promise<void> {
  if (!validate()) {
    return
  }

  const success = await authStore.register({
    email: formData.value.email,
    password: formData.value.password,
    passwordConfirm: formData.value.passwordConfirm,
    firstName: formData.value.firstName || undefined,
    lastName: formData.value.lastName || undefined,
  })

  if (success) {
    router.push('/dashboard')
  }
}

// Password strength indicator
const passwordStrength = computed(() => {
  const password = formData.value.password
  if (!password) return 0

  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++

  return strength
})

const passwordStrengthLabel = computed(() => {
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  return labels[passwordStrength.value] || 'Very Weak'
})

const passwordStrengthClass = computed(() => {
  const classes = ['strength-1', 'strength-2', 'strength-3', 'strength-4']
  return classes[passwordStrength.value - 1] || ''
})
</script>

<template>
  <form @submit.prevent="handleSubmit" class="register-form">
    <div v-if="authStore.error" class="form-error-banner">
      {{ authStore.error }}
    </div>

    <div class="form-group">
      <label for="email" class="form-label">Email *</label>
      <input
        id="email"
        v-model="formData.email"
        type="email"
        class="form-input"
        :class="{ 'has-error': errors.email }"
        placeholder="Enter your email"
        autocomplete="email"
      />
      <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="firstName" class="form-label">First Name</label>
        <input
          id="firstName"
          v-model="formData.firstName"
          type="text"
          class="form-input"
          placeholder="Optional"
          autocomplete="given-name"
        />
      </div>

      <div class="form-group">
        <label for="lastName" class="form-label">Last Name</label>
        <input
          id="lastName"
          v-model="formData.lastName"
          type="text"
          class="form-input"
          placeholder="Optional"
          autocomplete="family-name"
        />
      </div>
    </div>

    <div class="form-group">
      <label for="password" class="form-label">Password *</label>
      <input
        id="password"
        v-model="formData.password"
        type="password"
        class="form-input"
        :class="{ 'has-error': errors.password }"
        placeholder="Create a password"
        autocomplete="new-password"
      />
      <div v-if="formData.password" class="password-strength" :class="passwordStrengthClass">
        <div class="strength-bar">
          <div class="strength-fill" :style="{ width: `${passwordStrength * 25}%` }"></div>
        </div>
        <span class="strength-label">{{ passwordStrengthLabel }}</span>
      </div>
      <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
    </div>

    <div class="form-group">
      <label for="passwordConfirm" class="form-label">Confirm Password *</label>
      <input
        id="passwordConfirm"
        v-model="formData.passwordConfirm"
        type="password"
        class="form-input"
        :class="{ 'has-error': errors.passwordConfirm }"
        placeholder="Confirm your password"
        autocomplete="new-password"
      />
      <span v-if="errors.passwordConfirm" class="form-error">{{ errors.passwordConfirm }}</span>
    </div>

    <button type="submit" class="btn-primary submit-btn" :disabled="authStore.isLoading">
      {{ authStore.isLoading ? 'Creating Account...' : 'Create Account' }}
    </button>

    <p class="form-footer">
      Already have an account?
      <router-link to="/login" class="link">Sign in</router-link>
    </p>
  </form>
</template>

<style scoped>
.register-form {
  width: 100%;
}

.form-error-banner {
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-input.has-error {
  border-color: var(--color-error);
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition:
    width 0.3s ease,
    background-color 0.3s ease;
}

.strength-1 .strength-fill {
  width: 25%;
  background: var(--color-error);
}

.strength-2 .strength-fill {
  width: 50%;
  background: #ffc107;
}

.strength-3 .strength-fill {
  width: 75%;
  background: #17a2b8;
}

.strength-4 .strength-fill {
  width: 100%;
  background: var(--color-success);
}

.strength-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.submit-btn {
  width: 100%;
  margin-top: 1rem;
}

.form-footer {
  text-align: center;
  margin-top: 1.5rem;
  color: var(--text-secondary);
}
</style>
