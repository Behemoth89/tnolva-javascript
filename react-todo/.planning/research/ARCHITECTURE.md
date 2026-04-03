# Architecture Research

**Domain:** React Todo App with JWT Authentication
**Researched:** 2026-04-03
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         React App                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Routing Layer                         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │  Public    │  │ Protected  │  │  Authenticated     │  │  │
│  │  │  Routes    │  │  Routes    │  │  (login/signup)    │  │  │
│  │  │            │  │            │  │                    │  │  │
│  │  │ - Login    │  │ - Dashboard│  │ - Redirects to     │  │  │
│  │  │ - Register │  │ - Settings │  │   dashboard if     │  │  │
│  │  └─────┬──────┘  └─────┬──────┘  │   already logged   │  │  │
│  │        │               │         └────────────────────┘  │  │
│  └────────┼───────────────┼─────────────────────────────────┘  │
│           │               │                                     │
│  ┌────────┴───────────────┴─────────────────────────────────┐  │
│  │                    Layout Layer                            │  │
│  │  ┌──────────────┐  ┌──────────────────────────────────┐  │  │
│  │  │   Sidebar    │  │         Main Content             │  │  │
│  │  │              │  │                                  │  │  │
│  │  │ - Categories │  │ - Todo list                      │  │  │
│  │  │ - Filter     │  │ - Task cards                     │  │  │
│  │  │ - Priority   │  │ - Task detail/edit               │  │  │
│  │  │   icons      │  │ - Settings panels                │  │  │
│  │  └──────────────┘  └──────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Feature Modules                        │  │
│  │  ┌────────┐  ┌────────┐  ┌──────────┐  ┌────────────┐  │  │
│  │  │  Auth  │  │ Todos  │  │Settings  │  │  Shared    │  │  │
│  │  │        │  │        │  │          │  │            │  │  │
│  │  │Login   │  │List    │  │Categories│  │Components  │  │  │
│  │  │Register│  │Card    │  │Priorities│  │API Client  │  │  │
│  │  │Context │  │Form    │  │CRUD      │  │Utils       │  │  │
│  │  │Guard   │  │Hooks   │  │          │  │Types       │  │  │
│  │  └───┬────┘  └───┬────┘  └────┬─────┘  └─────┬──────┘  │  │
│  └──────┼───────────┼────────────┼──────────────┼─────────┘  │
│         │           │            │              │              │
│  ┌──────┴───────────┴────────────┴──────────────┴─────────┐  │
│  │                    State Layer                          │  │
│  │  ┌────────────────┐  ┌────────────────────────────┐   │  │
│  │  │  AuthContext   │  │  Local State (useState)    │   │  │
│  │  │                │  │                            │   │  │
│  │  │ - user         │  │ - form inputs             │   │  │
│  │  │ - loading      │  │ - UI toggles              │   │  │
│  │  │ - login/logout │  │ - modal states            │   │  │
│  │  └────────────────┘  └────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   Service Layer                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │              API Client (Axios)                   │  │  │
│  │  │                                                   │  │  │
│  │  │  Request Interceptor: Attach Bearer token        │  │  │
│  │  │  Response Interceptor: 401 → refresh → retry     │  │  │
│  │  │                                                   │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │  │  │
│  │  │  │  auth    │  │  tasks   │  │  categories   │  │  │  │
│  │  │  │Service   │  │Service   │  │  & priorities │  │  │  │
│  │  │  └──────────┘  └──────────┘  └───────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      TalTech API (External)    │
              │                               │
              │  /v1/auth/login               │
              │  /v1/auth/register            │
              │  /v1/auth/refresh             │
              │  /v1/todo-tasks               │
              │  /v1/todo-categories          │
              │  /v1/todo-priorities          │
              └───────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **AuthProvider** | Central auth state, login/logout, token management | React Context wrapping the app |
| **ProtectedRoute** | Guard authenticated routes, redirect to login | Wrapper component using `useAuth()` |
| **AuthenticatedRoute** | Guard login/register, redirect to dashboard if already logged in | Wrapper component using `useAuth()` |
| **ApiClient** | HTTP communication, token attachment, auto-refresh | Axios instance with request/response interceptors |
| **AuthService** | Auth-specific API calls (login, register, refresh) | Functions calling apiClient |
| **TodoService** | Task CRUD operations | Functions calling apiClient |
| **Sidebar** | Category filtering, priority display | Layout component consuming category/priority data |
| **TodoList** | Display, filter, and manage tasks | Feature component with local state for UI |
| **TodoForm** | Create/edit task with validation | Form component using controlled inputs |
| **SettingsPanel** | CRUD for categories and priorities | Feature component with sub-panels |

## Recommended Project Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── services/
│   │   │   └── authService.js
│   │   └── index.js              # Public API: exports components, hooks
│   │
│   ├── todos/
│   │   ├── components/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TodoList/
│   │   │   │   ├── TodoList.jsx
│   │   │   │   ├── TodoCard.jsx
│   │   │   │   └── index.js
│   │   │   └── TodoForm/
│   │   │       ├── TodoForm.jsx
│   │   │       └── index.js
│   │   ├── hooks/
│   │   │   ├── useTodos.js
│   │   │   └── useTodoMutations.js
│   │   ├── services/
│   │   │   └── todoService.js
│   │   └── index.js
│   │
│   └── settings/
│       ├── components/
│       │   ├── SettingsPage.jsx
│       │   ├── SettingsPanel.jsx
│       │   ├── CategoryManager.jsx
│       │   └── PriorityManager.jsx
│       ├── hooks/
│       │   ├── useCategories.js
│       │   └── usePriorities.js
│       ├── services/
│       │   └── settingsService.js
│       └── index.js
│
├── shared/
│   ├── components/
│   │   ├── MainLayout.jsx          # Sidebar + content wrapper
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   └── LoadingSpinner.jsx
│   ├── services/
│   │   └── apiClient.js            # Axios instance with interceptors
│   └── utils/
│       ├── formatDate.js
│       └── constants.js            # API base URL, route paths
│
├── App.jsx                         # Root component with routing
├── main.jsx                        # Entry point
└── index.css                       # Global styles + Tailwind directives
```

### Structure Rationale

- **`features/`** — Each feature (auth, todos, settings) owns its pages, components, hooks, and services. Pages live inside their feature — LoginPage belongs with auth, DashboardPage belongs with todos, SettingsPage belongs with settings. When working on a feature, everything is in one folder.
- **`shared/components/`** — Reusable UI primitives (Button, Input, Modal) and layout shells (MainLayout, Sidebar, Header). Flat structure — no subfolders needed at this scale.
- **`shared/services/`** — The Axios client with interceptors. Used by all feature services but owned by no single feature.
- **`shared/utils/`** — Pure utility functions with no dependencies on React or features.
- **No separate `pages/` folder** — Pages are part of their feature. A page is just a composition of feature components, so it belongs with them.
- **No separate `types/` folder** — This is a JavaScript project, not TypeScript. Types are unnecessary.
- **No shared `hooks/` folder** — Hooks stay within their features. If a hook becomes truly cross-feature, it can move to shared later.
- **Feature `index.js` files** — Each feature exposes a public API. Other features import from `@/features/todos`, not from internal paths. This enforces module boundaries and prevents tight coupling.

## Architectural Patterns

### Pattern 1: AuthContext + Protected Routes

**What:** Centralize authentication state in React Context, use wrapper components to guard routes.
**When to use:** Any React app with authenticated routes — the standard pattern for JWT-based SPAs.
**Trade-offs:** Context causes re-renders on state changes (mitigated by keeping auth state minimal). For this app size, it's the right choice over Redux.

**Example:**
```jsx
// features/auth/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount (token from httpOnly cookie, user data from API)
  useEffect(() => {
    authService.getCurrentUser()
      .then(userData => setUser(userData))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser({ firstName: data.firstName, lastName: data.lastName });
    return data;
  };

  const logout = async () => {
    await authService.logout().catch(() => {});
    setUser(null);
  };

  const value = { user, loading, isAuthenticated: !!user, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

```jsx
// features/auth/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}
```

### Pattern 2: API Client with Auto-Refresh Interceptor

**What:** Single Axios instance with request interceptor (attach Bearer token) and response interceptor (catch 401, refresh token, retry).
**When to use:** Any app with JWT authentication and auto-refresh — prevents token expiry from breaking user experience.
**Trade-offs:** The refresh queue pattern adds complexity but prevents race conditions when multiple requests fail simultaneously.

**Example:**
```jsx
// shared/services/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://taltech.akaver.com',
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.request.use((config) => {
  const token = authService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { token } = await authService.refreshToken();
        processQueue(null, token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authService.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Pattern 3: Feature Module Boundary

**What:** Each feature exports a public API through `index.js`. Internal implementation stays private. Other features import from the index, not from internal paths.
**When to use:** Any app with 2+ features — prevents tight coupling and makes refactoring safe.
**Trade-offs:** Adds a thin indirection layer. For this app size, it's lightweight but establishes good habits.

**Example:**
```js
// features/todos/index.js
export { TodoDashboard } from './components/TodoDashboard';
export { TodoList } from './components/TodoList';
export { TodoForm } from './components/TodoForm';
export { useTodos } from './hooks/useTodos';
export { useTodoMutations } from './hooks/useTodoMutations';
// Note: todoService is NOT exported — it's an internal detail

// Usage in another feature:
import { TodoList, useTodos } from '@/features/todos';
// NOT: import { TodoList } from '@/features/todos/components/TodoList';
```

### Pattern 4: Sidebar + Content Layout

**What:** MainLayout wraps all authenticated pages with a sidebar (category filter, priority icons) and main content area.
**When to use:** Apps with persistent navigation/filtering alongside content — standard dashboard pattern.
**Trade-offs:** Sidebar state (open/collapse) needs to be shared. Use local state lifted to layout, not global state.

## Data Flow

### Authentication Flow

```
User enters credentials
    ↓
LoginForm → authService.login()
    ↓
POST /v1/auth/login → { token, refreshToken, firstName, lastName }
    ↓
AuthContext.setUser() → token stored in memory
    ↓
Navigate to dashboard
    ↓
All subsequent requests: apiClient attaches Bearer token via interceptor
    ↓
On 401: interceptor → authService.refreshToken() → POST /v1/auth/refresh
    ↓
New token → retry original request → user never sees error
```

### Todo CRUD Flow

```
User clicks "Add Task"
    ↓
TodoForm (local state for inputs)
    ↓
onSubmit → useTodoMutations.createTodo()
    ↓
POST /v1/todo-tasks → { taskName, todoCategoryId, todoPriorityId, dueDt }
    ↓
Success → invalidate cache / refetch list → TodoList re-renders
    ↓
Error → useApiError() → toast notification
```

### Category Filter Flow

```
Sidebar loads categories via useCategories()
    ↓
User clicks category → setSelectedCategory()
    ↓
TodoList receives filter prop → fetches filtered tasks
    ↓
Tasks rendered with category labels and priority icons
```

### Key Data Flows

1. **Auth initialization:** On app mount, AuthContext calls `getCurrentUser()` to restore session from httpOnly cookie. Loading state blocks rendering until resolved.
2. **Token refresh:** Triggered by 401 response interceptor (not timer-based). Queue prevents race conditions when multiple requests fail simultaneously.
3. **Task operations:** All todo mutations go through `useTodoMutations` hook which calls `todoService`, updates local state on success, shows error toast on failure.
4. **Settings CRUD:** Category and priority management uses the same pattern — service layer → hook → component. Settings changes immediately reflected in sidebar via shared state.

### State Management Strategy

| State Type | Where | Why |
|------------|-------|-----|
| **Auth state** (user, isAuthenticated) | AuthContext | Needed by many components, changes rarely |
| **Access token** | Memory (AuthService singleton) | Security — not in localStorage, cleared on tab close |
| **Refresh token** | httpOnly cookie (set by API) | Security — JavaScript cannot access, auto-sent with requests |
| **Todo list** | Local component state (useState) | Single source of truth is the API, no need for global cache |
| **Form inputs** | Local component state | Only relevant to the form component |
| **Sidebar open/collapse** | MainLayout local state | UI concern, only layout needs it |
| **Selected category filter** | Dashboard page state → passed as prop | Filter is page-level concern, shared between sidebar and list |

**No global state library needed.** This app is small enough that Context + local state covers all needs. Adding Redux/Zustand would be over-engineering.

## Build Order Implications

The architecture dictates this build sequence:

```
Phase 1: Foundation
  ├── shared/services/apiClient.js     (Axios instance, interceptors)
  ├── shared/components/ui/            (Button, Input, LoadingSpinner)
  └── shared/components/Layout/        (MainLayout, Sidebar skeleton)

Phase 2: Authentication
  ├── features/auth/services/          (authService.js)
  ├── features/auth/context/           (AuthContext)
  ├── features/auth/components/        (LoginForm, RegisterForm, ProtectedRoute)
  └── pages/                           (LoginPage, RegisterPage)

Phase 3: Todo Core
  ├── features/todos/services/         (todoService.js)
  ├── features/todos/hooks/            (useTodos, useTodoMutations)
  ├── features/todos/components/       (TodoList, TodoCard, TodoForm)
  └── pages/DashboardPage.jsx

Phase 4: Settings
  ├── features/settings/services/      (settingsService.js)
  ├── features/settings/hooks/         (useCategories, usePriorities)
  ├── features/settings/components/    (CategoryManager, PriorityManager)
  └── pages/SettingsPage.jsx

Phase 5: Integration
  ├── Sidebar wiring (category filter → todo list)
  ├── Priority icons on task cards
  ├── Routing polish (redirects, loading states)
  └── Docker deployment config
```

**Dependencies explained:**
- Auth must come before todos because all task endpoints require authentication
- API client must come first because every service depends on it
- Settings can be built after todos (same pattern, different endpoints)
- Sidebar integration comes last because it needs both categories and todos to exist

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Current (single user, school project)** | Feature-based structure, Context + local state, no caching layer — perfect fit |
| **100+ users** | Add React Query for server state caching, consider virtualization for long todo lists |
| **1000+ users** | Add error tracking (Sentry), performance monitoring, consider code splitting by route |

### Scaling Priorities

1. **First bottleneck:** Long todo lists without virtualization. Fix: `@tanstack/react-virtual` for lists over ~100 items.
2. **Second bottleneck:** Repeated API calls on navigation. Fix: React Query with stale-time caching.
3. **Not a concern:** Auth performance — JWT is stateless, scales infinitely on the server side.

## Anti-Patterns

### Anti-Pattern 1: Storing JWT in localStorage

**What people do:** `localStorage.setItem('token', token)` for persistence across refreshes.
**Why it's wrong:** localStorage is accessible to any JavaScript running on the page — XSS attacks can steal tokens. It's the #1 auth security mistake in React tutorials.
**Do this instead:** Store access token in memory (React state/AuthService singleton). Use httpOnly cookies for refresh tokens (set by the TalTech API). On page refresh, re-authenticate via the refresh endpoint using the cookie.

### Anti-Pattern 2: Timer-Based Token Refresh

**What people do:** `setTimeout(refresh, tokenExpiry - 5min)` to proactively refresh.
**Why it's wrong:** Race conditions with multiple tabs, unnecessary refreshes if user is idle, breaks if clock is wrong.
**Do this instead:** Refresh on 401 response. Only refresh when actually needed. Use a queue to handle concurrent failed requests during refresh.

### Anti-Pattern 3: Putting All Components in One Folder

**What people do:** `src/components/Login.jsx, TodoList.jsx, Sidebar.jsx, Button.jsx...` (50+ files)
**Why it's wrong:** No separation of concerns, hard to find related code, deleting a feature means hunting through the entire folder.
**Do this instead:** Feature-based structure. All auth code in `features/auth/`, all todo code in `features/todos/`. Shared UI primitives in `shared/components/`.

### Anti-Pattern 4: Prop Drilling Auth State

**What people do:** Passing `user`, `isAuthenticated`, `onLogout` through 5 levels of components.
**Why it's wrong:** Every component in the chain becomes coupled to auth, refactoring is painful.
**Do this instead:** AuthContext at the root, `useAuth()` hook where needed. Only components that actually need auth data should call the hook.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **TalTech API** | Axios client with Bearer token | All endpoints under `/v1/`. API version is part of the path. |
| **JWT Auth** | Login returns token + refreshToken, refresh requires both | Token stored in memory, refreshToken in httpOnly cookie |
| **Docker** | Dockerfile + docker-compose for deployment | Nginx serving built React app, proxy to API if needed |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Auth ↔ Todos** | Auth provides `isAuthenticated`, todos don't need to know about auth | ProtectedRoute handles auth gating, todos just make API calls |
| **Sidebar ↔ TodoList** | Category selection passed as prop from DashboardPage | DashboardPage owns filter state, passes to both sidebar and list |
| **Settings ↔ Sidebar** | Settings updates categories, sidebar re-fetches via hook | No direct communication — both use `useCategories()` hook |
| **API Client ↔ All Services** | Services import apiClient, call methods | Interceptors handle auth transparently — services don't manage tokens |

## Sources

- OneUptime: "How to Structure Large-Scale React Applications for Maintainability" (Jan 2026) — Feature-based structure, module boundaries, state management architecture
- DEV Community / Syncfusion: "JWT Authentication in React: Secure Routes, Context, and Token Handling" (Dec 2025) — AuthContext pattern, protected routes, API interceptors with refresh queue
- DEV Community: "Recommended Folder Structure for React 2025" (Feb 2025) — Feature-based vs type-based organization, folder rationale
- Toxigon: "Setting up JWT auth in React without losing your mind" (Sep 2025) — Token storage security, refresh patterns, anti-patterns
- PROJECT.md — TalTech API spec, authentication flow, feature requirements

---
*Architecture research for: React Todo App with JWT Authentication*
*Researched: 2026-04-03*
