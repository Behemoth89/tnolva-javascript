<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { canPerformAction, type UserRole } from '@/utils/permissions'

const props = defineProps<{
  requiredRole: UserRole
}>()

const authStore = useAuthStore()

const hasAccess = computed(() => {
  return canPerformAction(authStore.currentRole, props.requiredRole)
})
</script>

<template>
  <slot v-if="hasAccess" />
  <slot v-else name="denied" />
</template>
