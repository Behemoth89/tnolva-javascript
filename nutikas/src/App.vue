<script setup lang="ts">
import ReloadPrompt from './components/ReloadPrompt.vue'
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <AppHeader />
  <router-view />
  <ReloadPrompt />
</template>