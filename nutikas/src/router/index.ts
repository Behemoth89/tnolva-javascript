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
    path: '/organiser',
    name: 'organiser-dashboard',
    component: () => import('@/views/OrganiserDashboard.vue'),
    meta: { requiresAuth: true, requiresRole: 'organiser' }
  },
  {
    path: '/organiser/contest/:id',
    name: 'organiser-contest',
    component: () => import('@/views/OrganiserContest.vue'),
    meta: { requiresAuth: true, requiresRole: 'organiser' }
  },
  {
    path: '/organiser/contest/:contestId/print',
    name: 'organiser-print',
    component: () => import('@/views/OrganiserPrint.vue'),
    meta: { requiresAuth: true, requiresRole: 'organiser' }
  },
  {
    path: '/organiser/contest/:contestId/markings',
    name: 'organiser-markings',
    component: () => import('@/views/OrganiserMarkings.vue'),
    meta: { requiresAuth: true, requiresRole: 'organiser' }
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
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