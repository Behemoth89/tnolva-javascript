---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/router/index.ts
  - src/stores/auth.ts
  - src/components/AppHeader.vue
  - src/App.vue
  - src/views/ContestsView.vue
autonomous: true
requirements: []
user_setup: []

must_haves:
  truths:
    - "Root URL (/) redirects to /contests"
    - "Header displays on all pages with Home, Login/Register or user info + Logout"
    - "Contests view visually differentiates contests where user has a registered team"
    - "\"My Teams\" button appears for contests with user's registered team"
  artifacts:
    - path: "src/components/AppHeader.vue"
      provides: "Persistent header with nav and auth controls"
    - path: "src/router/index.ts"
      provides: "Root redirect to /contests"
    - path: "src/stores/auth.ts"
      provides: "User info (name) storage and computed"
  key_links:
    - from: "src/App.vue"
      to: "src/components/AppHeader.vue"
      via: "import and placement above router-view"
    - from: "src/stores/auth.ts"
      to: "AppHeader.vue"
      via: "useAuthStore() for user info and auth state"
---

<objective>
Implement header navigation with auth-aware buttons and root redirect. Add visual differentiation for contests with user's registered teams.
</objective>

<context>
@src/router/index.ts
@src/stores/auth.ts
@src/stores/team.ts
@src/views/ContestsView.vue
@src/App.vue
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add root redirect + user info to auth store</name>
  <files>src/router/index.ts, src/stores/auth.ts</files>
  <action>
    **Router (src/router/index.ts):** Add redirect entry before existing routes:
    ```typescript
    { path: '/', redirect: '/contests' }
    ```

    **Auth store (src/stores/auth.ts):** Add user info state and computed:
    ```typescript
    const userName = ref<string | null>(null)
    const userFirstName = ref<string | null>(null)

    const isAuthenticated = computed(() => !!jwt.value)

    // Decode JWT to extract user info (firstName claim)
    function decodeJwt(token: string): void {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        userFirstName.value = payload.firstName ?? null
        userName.value = payload.name ?? payload.email ?? null
      } catch {
        userFirstName.value = null
        userName.value = null
      }
    }

    function setTokens(newJwt: string, newRefreshToken: string): void {
      jwt.value = newJwt
      refreshToken.value = newRefreshToken
      decodeJwt(newJwt)
      saveToStorage()
    }

    // Update loadFromStorage to decode existing JWT
    async function loadFromStorage(): Promise<void> {
      const jwtRecord = await db.auth.get('jwt')
      const rtRecord = await db.auth.get('refreshToken')
      jwt.value = jwtRecord?.value ?? null
      refreshToken.value = rtRecord?.value ?? null
      if (jwt.value) decodeJwt(jwt.value)
    }
    ```
    Add userName, userFirstName to the return statement.
  </action>
  <verify>
    <automated>grep -c "decodeJwt\|userName" src/stores/auth.ts</automated>
  </verify>
  <done>Auth store exposes userName, userFirstName; router redirects / to /contests</done>
</task>

<task type="auto">
  <name>Task 2: Create AppHeader component with auth-aware buttons</name>
  <files>src/components/AppHeader.vue</files>
  <action>
    Create `src/components/AppHeader.vue` with:

    **Template structure:**
    ```html
    <header class="app-header">
      <router-link to="/contests" class="home-btn">Home</router-link>
      
      <div class="header-right">
        <template v-if="auth.isAuthenticated">
          <div class="user-info">
            <span class="user-name">{{ auth.userName }}</span>
            <span class="user-subtitle">Logged in</span>
          </div>
          <button @click="handleLogout" class="logout-btn">Logout</button>
        </template>
        <template v-else>
          <router-link to="/login" class="auth-btn">Login</router-link>
          <router-link to="/register" class="auth-btn">Register</router-link>
        </template>
      </div>
    </header>
    ```

    **Script:**
    - Import useAuthStore, useRouter
    - Import identityApi from @/api/endpoints/identity
    - handleLogout: call identityApi.logout(auth.refreshToken), then auth.clearTokens(), router.push('/contests')

    **Style:** Flexbox header with Home on left, auth controls on right. User info stacked vertically (name on top, "Logged in" subtitle below). Use Tailwind classes or scoped CSS matching app's design system.
  </action>
  <verify>
    <automated>grep -c "router-link.*login\|router-link.*register" src/components/AppHeader.vue</automated>
  </verify>
  <done>Header shows Login/Register buttons when guest, user info + Logout when authenticated</done>
</task>

<task type="auto">
  <name>Task 3: Add header to App.vue, differentiate contests, add My Teams button</name>
  <files>src/App.vue, src/views/ContestsView.vue</files>
  <action>
    **App.vue:** Import and add AppHeader above router-view:
    ```html
    <template>
      <AppHeader />
      <router-view />
      <ReloadPrompt />
    </template>
    ```

    **ContestsView.vue:** Import useAuthStore and useTeamStore. On mount, if authenticated, fetch user's teams to identify contests with registered teams:

    ```typescript
    const auth = useAuthStore()
    const teamStore = useTeamStore()
    const myContestIds = ref<Set<string>>(new Set())

    onMounted(async () => {
      store.fetchContests()
      if (auth.isAuthenticated) {
        // Fetch all user teams across contests - need to iterate contests
        // For now, track contests that have results when user has teams
        // Alternative: check each contest for user's registered team via API
      }
    })
    ```

    For differentiating contests visually: Add a computed that checks if user is registered for each contest. Use a simple approach:
    - Fetch user's team data on mount if authenticated
    - Build a Set of contestIds where user has teams
    - In contest card, show different styling (e.g., border highlight) if contestId is in user's registered set

    For "My Teams" button: In each contest card, if user has a team registered for that contest, show a "My Teams" button/link to `/contests/{id}/my-teams`.

    Contest card structure should be:
    ```html
    <div class="contest-card" :class="{ 'has-team': myContestIds.has(item.id) }">
      ... existing card content ...
      <router-link 
        v-if="myContestIds.has(item.id)"
        :to="`/contests/${item.id}/my-teams`"
        class="my-teams-link"
        @click.stop
      >My Teams</router-link>
    </div>
    ```
  </action>
  <verify>
    <automated>grep -c "AppHeader\|has-team\|myContestIds" src/views/ContestsView.vue</automated>
  </verify>
  <done>Header visible on all pages; contests with user's teams visually distinct; My Teams button visible</done>
</task>

</tasks>

<verification>
- Navigate to / → should redirect to /contests
- Header shows Home + Login + Register buttons when logged out
- Header shows Home + user name + "Logged in" + Logout button when logged in
- Contests where user has a registered team have visual distinction
- Contests with user's team show "My Teams" button
</verification>

<success_criteria>
- Root URL redirects to /contests
- AppHeader visible on all pages
- Conditional auth buttons render correctly based on auth state
- User name displayed in header when authenticated
- Contests with user's registered team are visually differentiated
- My Teams button navigates to /contests/:id/my-teams
</success_criteria>

<output>
After completion, create `.planning/quick/260514-tqy-make-root-redirect-to-contacts-make-head/260514-tqy-SUMMARY.md`
</output>