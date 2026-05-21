import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/contests'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/contests',
    name: 'contests',
    component: () => import('@/views/ContestsView.vue'),
    meta: { guestOnly: false }
  },
  {
    path: '/contests/:id/results',
    name: 'contest-results',
    component: () => import('@/views/ContestResultsView.vue'),
    meta: { guestOnly: false }
  },
  {
    path: '/contests/:id',
    name: 'contest-detail',
    component: () => import('@/views/ContestDetailView.vue'),
    meta: { guestOnly: false }
  },
  {
    path: '/contests/:contestId/teams/:teamId',
    name: 'team-detail',
    component: () => import('@/views/TeamDetailView.vue'),
    meta: { guestOnly: false }
  },
  {
    path: '/contests/:id/my-teams',
    name: 'my-teams',
    component: () => import('@/views/MyTeamsView.vue'),
    meta: { guestOnly: false }
  },
  {
    path: '/race/:contestId/:userTeamId',
    name: 'race',
    component: () => import('@/views/RaceView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/debug-token',
    name: 'debug-token',
    component: () => import('@/views/DebugToken.vue'),
    meta: { debug: true }
  },
  {
    path: '/organizer',
    name: 'organizer-dashboard',
    component: () => import('@/views/OrganizerDashboard.vue'),
    meta: { requiresAuth: true, requiresRole: 'organiser' }
  },
  {
    path: '/organizer/contest/:id',
    name: 'organizer-contest',
    component: () => import('@/views/OrganizerContest.vue'),
    meta: { requiresAuth: true, requiresRole: 'organiser' }
  },
  {
    path: '/organizer/contest/:contestId/print',
    name: 'organizer-print',
    component: () => import('@/views/OrganizerPrint.vue'),
    meta: { requiresAuth: true, requiresRole: 'organiser' }
  },
  {
    path: '/organizer/contest/:contestId/markings',
    name: 'organizer-markings',
    component: () => import('@/views/OrganizerMarkings.vue'),
    meta: { requiresAuth: true, requiresRole: 'organiser' }
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  if (to.meta.debug) return

  const auth = useAuthStore()

  if (!auth.jwt) {
    await auth.loadFromStorage()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'contests' }
  }

  if (to.meta.requiresRole === 'organiser') {
    if (!auth.isOrganiser) {
      return { name: 'contests' }
    }
  }
})