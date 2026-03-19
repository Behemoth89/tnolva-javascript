<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CompanySelector from './CompanySelector.vue'

const router = useRouter()
const authStore = useAuthStore()

// Get user email from auth store
const userEmail = computed(() => authStore.user?.email ?? 'User')

// Handle logout
function handleLogout() {
  authStore.clearAuth()
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
          <!-- Company Selector Component -->
          <CompanySelector />

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
