<script setup lang="ts">
import RegisterForm from '@/components/auth/RegisterForm.vue'
</script>

<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <h1 class="register-title">Create Account</h1>
        <p class="register-subtitle">Join us and start managing your tasks</p>
      </div>

      <div class="card">
        <RegisterForm />
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-primary);
}

.register-container {
  width: 100%;
  max-width: 480px;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.register-subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: 1rem;
}
</style>
