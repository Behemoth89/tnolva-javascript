import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import LandingView from '@/views/LandingView.vue'
import MainView from '@/views/MainView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { useAuthStore } from '@/stores/auth'
import { canPerformAction, type UserRole } from '@/utils/permissions'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    // Protected routes with MainView layout
    {
      path: '/app',
      component: MainView,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'app-home',
          // Placeholder for future app dashboard
          component: {
            template:
              '<div class="p-8"><h1 class="text-2xl font-bold">Welcome to TNOLVA</h1><p class="mt-2 text-gray-600">Select a company to get started.</p></div>',
          },
        },
      ],
    },
    // Catch-all route for 404 - must be last
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

// Auth and role guard - navigation before each route
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresRole = to.meta.requiresRole as UserRole | undefined

  if (requiresAuth && !authStore.isAuthenticated) {
    // Not authenticated, redirect to login
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (requiresRole && authStore.isAuthenticated) {
    // Check if user has required role
    const hasPermission = canPerformAction(authStore.currentRole, requiresRole)
    if (!hasPermission) {
      // User lacks required role, redirect to app home
      next({ name: 'app-home' })
    } else {
      next()
    }
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    // Already authenticated, redirect to app
    next({ name: 'app-home' })
  } else if (to.name === 'register' && authStore.isAuthenticated) {
    // Already authenticated, redirect to app
    next({ name: 'app-home' })
  } else {
    next()
  }
})

export default router
