<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { identityApi } from '@/api/endpoints/identity'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout(): Promise<void> {
  try {
    if (auth.refreshToken) {
      await identityApi.logout(auth.refreshToken)
    }
  } catch {
  } finally {
    auth.clearTokens()
    router.push('/contests')
  }
}

function goToOrganizer() {
  router.push('/organizer')
}
</script>

<template>
  <header class="app-header">
    <router-link to="/contests" class="home-btn">Home</router-link>

    <div class="header-right">
      <template v-if="auth.isAuthenticated">
        <div v-if="auth.isAuthenticated" class="organiser-btn">
          <button @click="goToOrganizer" class="organiser-link">Organiser</button>
        </div>
        <div class="user-info">
          <span class="user-firstname">{{ auth.userFirstName }}</span>
          <span class="user-name">{{ auth.userName }}</span>
        </div>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </template>
      <template v-else>
        <router-link to="/login" class="auth-btn">Login</router-link>
        <router-link to="/register" class="auth-btn">Register</router-link>
      </template>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #2563eb;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.home-btn {
  color: white;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
}

.home-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 0.5rem;
}

.user-firstname {
  font-weight: 600;
  font-size: 0.875rem;
}

.user-name {
  font-size: 0.75rem;
  opacity: 0.8;
}

.auth-btn {
  color: white;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.auth-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.logout-btn {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.organiser-btn {
  margin-right: 0.5rem;
}

.organiser-link {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  text-decoration: none;
}

.organiser-link:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>