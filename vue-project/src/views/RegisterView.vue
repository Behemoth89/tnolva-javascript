<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiClient, ApiError } from '@/api/client'
import type { RegisterRequest, AuthResponse } from '@/api/types'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const firstName = ref('')
const lastName = ref('')
const companyName = ref('')

// Validation errors
const errors = ref({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  companyName: '',
})

// UI state
const isLoading = ref(false)
const submitError = ref('')

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Password requirements constants
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 72
const SPECIAL_CHAR_REGEX = /[@$!%*?&]/

// Password requirements for live validation (computed)
const passwordRequirements = computed(() => {
  const pwd = password.value
  return {
    minLength: pwd.length >= MIN_PASSWORD_LENGTH,
    maxLength: pwd.length <= MAX_PASSWORD_LENGTH,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    specialChar: SPECIAL_CHAR_REGEX.test(pwd),
  }
})

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

// Validate password length
function validatePassword(): boolean {
  if (!password.value) {
    errors.value.password = 'Password is required'
    return false
  }
  if (password.value.length < MIN_PASSWORD_LENGTH) {
    errors.value.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    return false
  }
  if (password.value.length > MAX_PASSWORD_LENGTH) {
    errors.value.password = `Password must be at most ${MAX_PASSWORD_LENGTH} characters`
    return false
  }
  if (!passwordRequirements.value.uppercase) {
    errors.value.password = 'Password must contain at least one uppercase letter'
    return false
  }
  if (!passwordRequirements.value.lowercase) {
    errors.value.password = 'Password must contain at least one lowercase letter'
    return false
  }
  if (!passwordRequirements.value.number) {
    errors.value.password = 'Password must contain at least one number'
    return false
  }
  if (!passwordRequirements.value.specialChar) {
    errors.value.password = 'Password must contain at least one special character (@$!%*?&)'
    return false
  }
  errors.value.password = ''
  return true
}

// Validate password match
function validateConfirmPassword(): boolean {
  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Please confirm your password'
    return false
  }
  if (confirmPassword.value !== password.value) {
    errors.value.confirmPassword = 'Passwords do not match'
    return false
  }
  errors.value.confirmPassword = ''
  return true
}

// Validate first name required
function validateFirstName(): boolean {
  if (!firstName.value.trim()) {
    errors.value.firstName = 'First name is required'
    return false
  }
  errors.value.firstName = ''
  return true
}

// Validate last name required
function validateLastName(): boolean {
  if (!lastName.value.trim()) {
    errors.value.lastName = 'Last name is required'
    return false
  }
  errors.value.lastName = ''
  return true
}

// Validate all form fields
function validateForm(): boolean {
  const isEmailValid = validateEmail()
  const isPasswordValid = validatePassword()
  const isConfirmPasswordValid = validateConfirmPassword()
  const isFirstNameValid = validateFirstName()
  const isLastNameValid = validateLastName()

  return (
    isEmailValid && isPasswordValid && isConfirmPasswordValid && isFirstNameValid && isLastNameValid
  )
}

// Clear error when user starts typing
function clearError(field: keyof typeof errors.value) {
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
    // Make registration request
    const registerData: RegisterRequest = {
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
    }

    // Add company name if provided
    if (companyName.value.trim()) {
      registerData.companyName = companyName.value.trim()
    }

    const response = await apiClient.post<AuthResponse>('/auth/register', registerData)

    // Validate response has required token data
    if (!response.accessToken || !response.refreshToken) {
      console.error('Invalid auth response: missing tokens')
      submitError.value = 'Registration failed. Please try again.'
      return
    }

    // Update auth store with tokens and user
    authStore.setTokens(response.accessToken, response.refreshToken)
    authStore.setUser(response.user)

    // Redirect to main app
    router.push('/')
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
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Already have an account?
          <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500">
            Sign in
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

      <!-- Registration Form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm space-y-4">
          <!-- Name Fields Row -->
          <div class="grid grid-cols-2 gap-4">
            <!-- First Name -->
            <div>
              <label for="firstName" class="sr-only">First name</label>
              <input
                id="firstName"
                v-model="firstName"
                type="text"
                autocomplete="given-name"
                required
                :disabled="isLoading"
                placeholder="First name"
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                :class="{ 'border-red-300': errors.firstName }"
                @input="clearError('firstName')"
              />
              <p v-if="errors.firstName" class="text-red-500 text-xs mt-1">
                {{ errors.firstName }}
              </p>
            </div>

            <!-- Last Name -->
            <div>
              <label for="lastName" class="sr-only">Last name</label>
              <input
                id="lastName"
                v-model="lastName"
                type="text"
                autocomplete="family-name"
                required
                :disabled="isLoading"
                placeholder="Last name"
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                :class="{ 'border-red-300': errors.lastName }"
                @input="clearError('lastName')"
              />
              <p v-if="errors.lastName" class="text-red-500 text-xs mt-1">{{ errors.lastName }}</p>
            </div>
          </div>

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
              class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              :class="{ 'border-red-300': errors.email }"
              @input="clearError('email')"
            />
            <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              :disabled="isLoading"
              placeholder="Password (8+ chars, uppercase, lowercase, number, special)"
              class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              :class="{ 'border-red-300': errors.password }"
              @input="clearError('password')"
            />
            <p v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</p>
          </div>

          <!-- Password Requirements Checklist (shown when password has content) -->
          <div v-if="password" class="text-xs space-y-1">
            <div class="grid grid-cols-2 gap-x-4 gap-y-1">
              <div :class="passwordRequirements.minLength ? 'text-green-600' : 'text-gray-500'">
                <span v-if="passwordRequirements.minLength">✓</span><span v-else>✗</span> At least 8
                characters
              </div>
              <div :class="passwordRequirements.maxLength ? 'text-green-600' : 'text-gray-500'">
                <span v-if="passwordRequirements.maxLength">✓</span><span v-else>✗</span> Maximum 72
                characters
              </div>
              <div :class="passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'">
                <span v-if="passwordRequirements.uppercase">✓</span><span v-else>✗</span> One
                uppercase letter
              </div>
              <div :class="passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'">
                <span v-if="passwordRequirements.lowercase">✓</span><span v-else>✗</span> One
                lowercase letter
              </div>
              <div :class="passwordRequirements.number ? 'text-green-600' : 'text-gray-500'">
                <span v-if="passwordRequirements.number">✓</span><span v-else>✗</span> One number
              </div>
              <div :class="passwordRequirements.specialChar ? 'text-green-600' : 'text-gray-500'">
                <span v-if="passwordRequirements.specialChar">✓</span><span v-else>✗</span> One
                special character (@$!%*?&)
              </div>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label for="confirmPassword" class="sr-only">Confirm password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              :disabled="isLoading"
              placeholder="Confirm password"
              class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              :class="{ 'border-red-300': errors.confirmPassword }"
              @input="clearError('confirmPassword')"
            />
            <p v-if="errors.confirmPassword" class="text-red-500 text-xs mt-1">
              {{ errors.confirmPassword }}
            </p>
          </div>

          <!-- Company Name Field (Optional) -->
          <div>
            <label for="companyName" class="sr-only">Company name (optional)</label>
            <input
              id="companyName"
              v-model="companyName"
              type="text"
              autocomplete="organization"
              :disabled="isLoading"
              placeholder="Company name (optional)"
              class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              @input="clearError('companyName')"
            />
            <p class="text-gray-500 text-xs mt-1">
              Optional - create a new company or join an existing one
            </p>
          </div>
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
              {{ isLoading ? 'Creating account...' : 'Create account' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
