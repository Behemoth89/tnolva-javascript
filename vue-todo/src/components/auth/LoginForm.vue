<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { LoginCredentials } from '@/types/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Form data
const formData = ref<LoginCredentials>({
  email: '',
  password: '',
})

// Validation errors
const errors = ref<Record<string, string>>({})

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
  }

  return Object.keys(errors.value).length === 0
}

// Handle submit
async function handleSubmit(): Promise<void> {
  if (!validate()) {
    return
  }

  const success = await authStore.login(formData.value)

  if (success) {
    const redirect = route.query.redirect as string
    router.push(redirect || '/dashboard')
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="login-form">
    <div v-if="authStore.error" class="form-error-banner">
      {{ authStore.error }}
    </div>

    <div class="form-group">
      <label for="email" class="form-label">Email</label>
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

    <div class="form-group">
      <label for="password" class="form-label">Password</label>
      <input
        id="password"
        v-model="formData.password"
        type="password"
        class="form-input"
        :class="{ 'has-error': errors.password }"
        placeholder="Enter your password"
        autocomplete="current-password"
      />
      <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
    </div>

    <button type="submit" class="btn-primary submit-btn" :disabled="authStore.isLoading">
      {{ authStore.isLoading ? 'Signing in...' : 'Sign In' }}
    </button>

    <p class="form-footer">
      Don't have an account?
      <router-link to="/register" class="link">Create one</router-link>
    </p>
  </form>
</template>

<style scoped>
.login-form {
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

.form-input.has-error {
  border-color: var(--color-error);
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
