<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Get companies from auth store (Pinia auto-unwraps computed refs)
const companies = authStore.getCompanies

// Get selected company ID from auth store
const selectedCompanyId = computed(() => authStore.selectedCompanyId)

// Show selector only if user has multiple companies
const showSelector = computed(() => companies.length > 1)

// Get current selected company for display
const currentCompany = computed(() => {
  if (!selectedCompanyId.value) return null
  return companies.find((c) => c.companyId === selectedCompanyId.value)
})

// Handle company selection - use switchCompany for API call
async function handleCompanySelect(event: Event) {
  const target = event.target as HTMLSelectElement
  const companyId = target.value

  try {
    if (companies.length > 1) {
      // Multiple companies - use switchCompany action
      await authStore.switchCompany(companyId)
    } else {
      // Single company - just set it
      authStore.setSelectedCompany(companyId)
    }
  } catch (error) {
    console.error('Failed to switch company:', error)
    // Revert selection on error
    target.value = selectedCompanyId.value ?? ''
  }
}
</script>

<template>
  <div v-if="showSelector" class="relative">
    <select
      :value="selectedCompanyId"
      @change="handleCompanySelect"
      class="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 px-3 py-1.5"
    >
      <option value="" disabled>Select company</option>
      <option v-for="company in companies" :key="company.companyId" :value="company.companyId">
        {{ company.companyId }} ({{ company.role }})
      </option>
    </select>
    <div
      class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
    >
      <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
      </svg>
    </div>
  </div>
  <div v-else-if="currentCompany" class="text-sm text-gray-600">
    {{ currentCompany.companyId }} ({{ currentCompany.role }})
  </div>
</template>
