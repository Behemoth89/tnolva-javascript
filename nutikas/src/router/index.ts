import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // Phase 2+ routes will be added later
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})