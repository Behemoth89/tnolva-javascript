<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Get user email from auth store
const userEmail = computed(() => authStore.user?.email ?? 'User')

// Get companies from auth store
const companies = computed(() => authStore.user?.companies ?? [])

// Get selected company ID from API client
import { apiClient } from '@/api/client'
const selectedCompanyId = ref<string | null>(null)

const STORAGE_KEY = 'tnolva_selected_company'

// Initialize selected company from localStorage or API client
onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    selectedCompanyId.value = stored
    authStore.setSelectedCompany(stored)
  } else {
    selectedCompanyId.value = apiClient.getSelectedCompany()
  }
})

// Show selector only if user has multiple companies
const showCompanySelector = computed(() => companies.value.length > 1)

// Handle company selection
function selectCompany(companyId: string) {
  selectedCompanyId.value = companyId
  authStore.setSelectedCompany(companyId)
  // Persist selection to localStorage
  localStorage.setItem(STORAGE_KEY, companyId)
}

// Handle logout
function handleLogout() {
  authStore.clearAuth()
  // Clear stored company selection
  localStorage.removeItem(STORAGE_KEY)
  router.push('/')
}
</script>

<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo / App Name -->
        <div class="flex-shrink-0">
          <span class="text-xl font-bold text-blue-600">TNOLVA</span>
        </div>

        <!-- Right side: Company Selector + User Info + Logout -->
        <div class="flex items-center space-x-4">
          <!-- Company Selector -->
          <div v-if="showCompanySelector" class="relative">
            <select
              :value="selectedCompanyId"
              @change="selectCompany(($event.target as HTMLSelectElement).value)"
              class="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 px-3 py-1.5"
            >
              <option value="" disabled>Select company</option>
              <option
                v-for="company in companies"
                :key="company.companyId"
                :value="company.companyId"
              >
                {{ company.companyId }} ({{ company.role }})
              </option>
            </select>
            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
            >
              <svg
                class="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path
                  d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                />
              </svg>
            </div>
          </div>

          <!-- User Email -->
          <div class="text-sm text-gray-700">
            {{ userEmail }}
          </div>

          <!-- Logout Button -->
          <button
            @click="handleLogout"
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
