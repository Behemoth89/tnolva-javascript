<template>
  <div style="padding: 20px;">
    <h1>Debug Token</h1>
    <pre>{{ payload }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const payload = ref<object | null>(null)

onMounted(() => {
  if (auth.jwt) {
    payload.value = JSON.parse(atob(auth.jwt.split('.')[1]))
  }
})
</script>