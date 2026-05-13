# Phase 5: Race Participation - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 10 new files, 2 modified files
**Analogs found:** 9 / 12

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/api/marking.ts` | api | CRUD | `src/api/team.ts` | exact |
| `src/types/race.ts` | types | none | `src/types/team.ts` | exact |
| `src/stores/race.ts` | store | request-response | `src/stores/team.ts` | exact |
| `src/composables/useToast.ts` | composable | event-driven | `src/composables/useAuth.ts` | role-match |
| `src/components/ToastNotification.vue` | component | event-driven | `src/components/RegistrationModal.vue` | role-match |
| `src/components/RaceScanner.vue` | component | streaming | `src/components/RegistrationModal.vue` | partial |
| `src/components/ScoreCard.vue` | component | request-response | `src/components/RegistrationModal.vue` | role-match |
| `src/components/TeamInfoCard.vue` | component | request-response | `src/components/RegistrationModal.vue` | role-match |
| `src/components/RaceScorePanel.vue` | component | request-response | `src/components/RegistrationModal.vue` | role-match |
| `src/views/RaceView.vue` | view | request-response | `src/views/ContestDetailView.vue` | exact |
| `src/router/index.ts` (mod) | config | request-response | `src/router/index.ts` | exact |
| `src/db/index.ts` (mod) | config | none | `src/db/index.ts` | exact |

## Pattern Assignments

### `src/api/marking.ts` (api, CRUD)

**Analog:** `src/api/team.ts`

**Imports pattern** (lines 1-2):
```typescript
import { api } from '@/api'
import type { MarkingResponse } from '@/types/race'
```

**Core API pattern** (lines 8-15 of `src/api/team.ts`):
```typescript
export async function getUserTeamActivation(teamId: string): Promise<UserTeamActivation> {
  const response = await api.get<UserTeamActivation>(`/UserTeams/${teamId}`)
  return response.data
}
```
**Apply:** Use same pattern for `submitMarking` — `api.post<MarkingResponse>('/Markings', request)`.

**Auth header injection** (line 24-27 of `src/api/index.ts`):
```typescript
api.interceptors.request.use(
  (config) => {
    const auth = useAuthStore()
    if (auth.jwt) {
      config.headers.Authorization = `Bearer ${auth.jwt}`
    }
    return config
  }
)
```
**Apply:** No changes needed — `api.post` already uses the configured Axios instance with interceptor.

---

### `src/types/race.ts` (types, none)

**Analog:** `src/types/team.ts`

**Interface pattern** (lines 6-11 of `src/types/team.ts`):
```typescript
export interface TeamRegistrationRequest {
  teamName: string        // max 128, min 1
  teamMembers: string     // max 255, min 1 — comma-separated member names
  contestClassId: string  // UUID
}
```
**Apply:** Define `MarkingRequest` with `checkPointId: string`, `userTeamId: string`, optional `lat`/`lon`/`dt`.

**Type exports** (line 39 of `src/types/team.ts`):
```typescript
  markings: import('./contest').MarkingListItem[] | null
```
**Apply:** Use same cross-type import pattern for `MarkingResponse` referencing `UserTeamActivation`.

---

### `src/stores/race.ts` (store, request-response)

**Analog:** `src/stores/team.ts`

**Store definition pattern** (lines 7-15 of `src/stores/team.ts`):
```typescript
export const useTeamStore = defineStore('team', () => {
  // State
  const myTeams = ref<UserTeamListItem[]>([])
  const activeTeam = ref<ActiveTeamRecord | null>(null)
  const currentTeamDetail = ref<UserTeamActivation | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
```
**Apply:** Define `useRaceStore` with `raceState` ref for `startDT`, `finishDT`, `score`, etc.

**Action pattern with try/catch** (lines 51-63 of `src/stores/team.ts`):
```typescript
async function fetchMyTeams(contestId: string): Promise<void> {
  loading.value = true
  error.value = null
  try {
    myTeams.value = await teamApi.getUserTeams(contestId)
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to fetch teams'
    throw err
  } finally {
    loading.value = false
  }
}
```
**Apply:** `submitScan` action follows same pattern — loading state, error handling, Dexie persistence.

**Return statement** (lines 82-95 of `src/stores/team.ts`):
```typescript
return {
  // State
  myTeams,
  activeTeam,
  currentTeamDetail,
  loading,
  error,
  // Actions
  loadActiveTeam,
  setActiveTeam,
  clearActiveTeam,
  fetchMyTeams,
  fetchTeamDetail
}
```
**Apply:** Return all state and actions with same grouping.

---

### `src/composables/useToast.ts` (composable, event-driven)

**Analog:** `src/composables/useAuth.ts`

**Composable structure** (lines 7-53 of `src/composables/useAuth.ts`):
```typescript
export function useAuth() {
  const router = useRouter()
  const auth = useAuthStore()

  const error = ref<string>('')
  const isLoading = ref(false)

  async function login(credentials: LoginInfo): Promise<boolean> {
    error.value = ''
    isLoading.value = true
    try {
      const response = await identityApi.login(credentials)
      auth.setTokens(response.jwt, response.refreshToken)
      return true
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  return { error, isLoading, login, register, logout }
}
```
**Apply:** `useToast` returns `{ toasts, show, dismiss, success, error, info }` using `provide/inject` pattern.

**provide/inject pattern** (line 468-471 from RESEARCH.md):
```typescript
const TOAST_SYMBOL = Symbol('toast')

export function provideToast() {
  return provide(TOAST_SYMBOL, createToast())
}

export function useToast(): ReturnType<typeof createToast> {
  return inject(TOAST_SYMBOL) as ReturnType<typeof createToast>
}
```

---

### `src/components/ToastNotification.vue` (component, event-driven)

**Analog:** `src/components/RegistrationModal.vue`

**Component structure** (lines 1-96 of `src/components/RegistrationModal.vue`):
```typescript
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ ... }>()
const emit = defineEmits<{ close: [] }>()

const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  try { ... }
  catch (err) { ... }
  finally { loading.value = false }
}
</script>
```
**Apply:** ToastNotification uses `useToast()` to get `toasts` array, renders with `v-for`, uses Teleport to body.

**Conditional class binding** (lines 250-253 of `src/components/RegistrationModal.vue`):
```typescript
.radio-option:has(input:checked) {
  border-color: #1976d2;
  background: #f0f7ff;
}
```
**Apply:** Use color-coded classes for toast types (success=green, error=red).

---

### `src/components/RaceScanner.vue` (component, streaming)

**Partial Analog:** `src/components/RegistrationModal.vue`

**No close streaming analog exists.** Use RESEARCH.md pattern:

**Camera scanning pattern** (from RESEARCH.md):
```typescript
import { QrcodeStream } from 'vue-qrcode-reader'

const pause = ref(false)

async function onDetect(detectedCodes: DetectedBarcode[]) {
  if (pause.value || detectedCodes.length === 0) return
  pause.value = true
  
  const cpId = detectedCodes[0].rawValue
  await submitMarking(cpId)
  
  setTimeout(() => { pause.value = false }, 2000)
}
```

**Template pattern** (from RESEARCH.md):
```vue
<QrcodeStream
  :paused="pause"
  :constraints="{ facingMode: 'environment' }"
  @detect="onDetect"
  @error="onCameraError"
/>
```

**Props/emit pattern** (lines 13-21 of `src/components/RegistrationModal.vue`):
```typescript
const props = defineProps<{
  show: boolean
  contestId: string
  contestClasses: ContestClass[]
}>()

const emit = defineEmits<{
  close: []
}>()
```
**Apply:** RaceScanner receives `contestId`, `userTeamId` props, emits scan events.

---

### `src/components/ScoreCard.vue` (component, request-response)

**Analog:** `src/components/RegistrationModal.vue`

**Display pattern** (lines 79-86 of `src/components/RegistrationModal.vue`):
```typescript
function close() {
  form.teamName = ''
  form.teamMembers = ''
  form.contestClassId = ''
  emit('close')
}
```
**Apply:** ScoreCard receives `score`, `bonus`, `penalty`, `finalScore`, `position` props, displays hero score.

**Position display** (from RESEARCH.md):
```typescript
function computePosition(results, userTeamId, contestClassId) {
  const classTeams = results.teams?.filter(t => t.contestClassId === contestClassId) ?? []
  const sorted = [...classTeams].sort((a, b) =>
    b.finalScore - a.finalScore || (a.finishDT && b.finishDT
      ? new Date(a.finishDT).getTime() - new Date(b.finishDT).getTime()
      : 0)
  )
  const index = sorted.findIndex(t => t.id === userTeamId)
  return index >= 0 ? { ordinal: index + 1, total: sorted.length } : null
}
```

---

### `src/components/TeamInfoCard.vue` (component, request-response)

**Analog:** `src/components/RegistrationModal.vue`

**Data display pattern** (lines 92-106 of `src/components/RegistrationModal.vue`):
```typescript
<div v-for="cls in contestClasses" :key="cls.id" class="class-item">
  <div class="class-info">
    <span class="class-name">{{ cls.name || 'Unnamed Class' }}</span>
    <span class="class-duration">{{ formatDuration(cls.duration) }}</span>
  </div>
</div>
```
**Apply:** TeamInfoCard displays `teamName`, `contestClassName`, `memberNames` from `activeTeam`.

---

### `src/components/RaceScorePanel.vue` (component, request-response)

**Analog:** `src/components/RegistrationModal.vue`

**Collapsible sections pattern** (from RESEARCH.md):
```typescript
// Element Plus ElCollapse for collapsible cards
// score as hero element at top, breakdown sections below
```

**Props pattern** (lines 13-17 of `src/components/RegistrationModal.vue`):
```typescript
const props = defineProps<{
  show: boolean
  contestId: string
  contestClasses: ContestClass[]
}>()
```
**Apply:** RaceScorePanel receives `startDT`, `finishDT`, `score`, `bonus`, `penalty`, `finalScore`, `elapsedTime`.

---

### `src/views/RaceView.vue` (view, request-response)

**Analog:** `src/views/ContestDetailView.vue`

**View structure** (lines 1-63 of `src/views/ContestDetailView.vue`):
```typescript
<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamStore } from '@/stores/team'
import RegistrationModal from '@/components/RegistrationModal.vue'

const route = useRoute()
const router = useRouter()
const store = useTeamStore()

const id = route.params.id as string

onMounted(async () => {
  if (store.contests.length === 0) {
    await store.fetchContests()
  }
  await store.fetchContest(id)
})
```
**Apply:** RaceView uses `useRaceStore`, `useTeamStore`, `useToast`. Route params: `contestId`, `userTeamId`.

**Loading/error/empty states** (lines 67-143 of `src/views/ContestDetailView.vue`):
```typescript
<div v-if="store.loading" class="loading">
  <span>Loading contest details...</span>
</div>

<div v-else-if="store.error" class="error">
  <p>{{ store.error }}</p>
  <button @click="store.fetchContest(id)">Retry</button>
</div>

<template v-else-if="store.currentContest">
  <!-- Content -->
</template>

<div v-else class="empty-state">
  <p>Contest not found.</p>
</div>
```
**Apply:** Same pattern for RaceView — show loading, error, content states.

**Combined layout** (from RESEARCH.md):
```
┌──────────────────┐  ┌─────────────────────────────────┐
│  Team Info Card  │  │     Scanner Panel (QrcodeStream) │
│  - team name     │  │  ┌─────────────────────────────┐ │
│  - class         │  │  │  Camera Preview (full-bleed) │ │
│  - members       │  │  └─────────────────────────────┘ │
│  - score panel   │  │  ┌─────────────────────────────┐ │
│  - position      │  │  │  Manual CP Input + Submit    │ │
│  [🔄 Refresh]   │  │  └─────────────────────────────┘ │
└──────────────────┘  │  [🔄 Refresh FAB]               │
                      └─────────────────────────────────┘
```

---

### `src/router/index.ts` (mod, config)

**Analog:** `src/router/index.ts` (self)

**Route pattern** (lines 30-35 of `src/router/index.ts`):
```typescript
{
  path: '/contests/:id',
  name: 'contest-detail',
  component: () => import('@/views/ContestDetailView.vue'),
  meta: { guestOnly: false }
}
```
**Apply:** Add race route:
```typescript
{
  path: '/race/:contestId/:userTeamId',
  name: 'race',
  component: () => import('@/views/RaceView.vue'),
  meta: { requiresAuth: true }
}
```

**Router guard** (lines 55-68 of `src/router/index.ts`):
```typescript
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.jwt && !auth.refreshToken) {
    await auth.loadFromStorage()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
```
**Apply:** Use existing `requiresAuth` meta pattern for race route.

---

### `src/db/index.ts` (mod, none)

**Analog:** `src/db/index.ts` (self)

**Dexie class pattern** (lines 4-16 of `src/db/index.ts`):
```typescript
export class NutikasAuth extends Dexie {
  auth!: Table<{ key: string; value: string }>
  activeTeam!: Table<ActiveTeamRecord>

  constructor() {
    super('NutikasAuth')
    this.version(1).stores({
      auth: 'key'
    })
    this.version(2).stores({
      activeTeam: 'id'
    })
  }
}
```
**Apply:** Add version 3 for toast preferences only if needed — per D-11, preference can be in memory or localStorage.

---

## Shared Patterns

### API Pattern (JWT injection)

**Source:** `src/api/index.ts` (lines 22-30)
**Apply to:** `src/api/marking.ts`
```typescript
api.interceptors.request.use(
  (config) => {
    const auth = useAuthStore()
    if (auth.jwt) {
      config.headers.Authorization = `Bearer ${auth.jwt}`
    }
    return config
  }
)
```
No changes needed — marking.ts uses `api.post()` which has interceptor configured.

### Toast Notification Pattern

**Source:** `src/components/RegistrationModal.vue` (lines 5, 78-82)
**Apply to:** All components that need user feedback

```typescript
import { ElMessage } from 'element-plus'

// Error feedback
ElMessage.error(msg)

// Success feedback
ElMessage.success('Team registered successfully!')
```

**Note:** Research recommends custom `useToast` composable over Element Plus Message for color-coded toasts with auto-dismiss preference.

### Element Plus Usage

**Source:** `src/components/RegistrationModal.vue`
**Apply to:** `src/components/RaceScorePanel.vue` (ElCollapse, ElCollapseItem)

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/RaceScanner.vue` | component | streaming | No camera/streaming components exist — use RESEARCH.md `vue-qrcode-reader` patterns |
| `src/composables/useToast.ts` | composable | event-driven | No existing toast composable — use RESEARCH.md `useToast` pattern |
| `src/components/ToastNotification.vue` | component | event-driven | No existing toast component — use RESEARCH.md ToastNotification pattern |

---

## Metadata

**Analog search scope:** `src/api/*.ts`, `src/stores/*.ts`, `src/composables/*.ts`, `src/components/**/*.vue`, `src/views/*.vue`, `src/types/*.ts`, `src/db/index.ts`, `src/router/index.ts`
**Files scanned:** 14
**Pattern extraction date:** 2026-05-14