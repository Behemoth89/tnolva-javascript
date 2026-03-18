<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiClient, ApiError } from '@/api/client'
import type { LoginRequest, AuthResponse } from '@/api/types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Form state
const email = ref('')
const password = ref('')

// Validation errors
const errors = ref({
  email: '',
  password: '',
})

// UI state
const isLoading = ref(false)
const submitError = ref('')

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validate email format
function validateEmail(): boolean {
  if (!email.value) {
    errors.value.email = 'Email is required'
    return false
  }
  if (!emailRegex.test(email.value)) {
    errors.value.email = 'Please enter a valid email address'
    return false
  }
  errors.value.email = ''
  return true
}

// Validate password required
function validatePassword(): boolean {
  if (!password.value) {
    errors.value.password = 'Password is required'
    return false
  }
  errors.value.password = ''
  return true
}

// Validate all form fields
function validateForm(): boolean {
  const isEmailValid = validateEmail()
  const isPasswordValid = validatePassword()
  return isEmailValid && isPasswordValid
}

// Clear error when user starts typing
function clearError(field: 'email' | 'password') {
  errors.value[field] = ''
  submitError.value = ''
}

// Handle form submission
async function handleSubmit() {
  // Clear previous errors
  submitError.value = ''

  // Validate form
  if (!validateForm()) {
    return
  }

  // Set loading state
  isLoading.value = true
  authStore.setLoading(true)

  try {
    // Make login request
    const loginData: LoginRequest = {
      email: email.value,
      password: password.value,
    }

    const response = await apiClient.post<AuthResponse>('/auth/login', loginData)

    // Validate response has required token data
    if (!response.accessToken || !response.refreshToken) {
      console.error('Invalid auth response: missing tokens')
      submitError.value = 'Authentication failed. Please try again.'
      return
    }

    // Update auth store with tokens and user
    authStore.setTokens(response.accessToken, response.refreshToken)
    authStore.setUser(response.user)

    // Redirect to original destination or main app
    const redirectPath = route.query.redirect as string
    router.push(redirectPath || '/app')
  } catch (error) {
    if (error instanceof ApiError) {
      submitError.value = error.message
    } else {
      submitError.value = 'An unexpected error occurred. Please try again.'
    }
  } finally {
    isLoading.value = false
    authStore.setLoading(false)
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <router-link to="/register" class="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </router-link>
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="submitError"
        class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <span class="block sm:inline">{{ submitError }}</span>
      </div>

      <!-- Login Form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <!-- Email Field -->
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              :disabled="isLoading"
              placeholder="Email address"
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              :class="{ 'border-red-300': errors.email }"
              @input="clearError('email')"
            />
          </div>

          <!-- Email Error -->
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>

          <!-- Password Field -->
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              :disabled="isLoading"
              placeholder="Password"
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              :class="{ 'border-red-300': errors.password }"
              @input="clearError('password')"
            />
          </div>

          <!-- Password Error -->
          <p v-if="errors.password" class="text-red-500 text-sm mt-1">{{ errors.password }}</p>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <!-- Loading Spinner -->
              <svg
                class="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </span>
            <span :class="{ 'pl-3': isLoading }">
              {{ isLoading ? 'Signing in...' : 'Sign in' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
