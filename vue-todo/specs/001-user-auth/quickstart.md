# Quickstart: User Authentication

## Prerequisites

- Node.js ^20.19.0 || >=22.12.0
- npm installed

## Installation

No additional dependencies required. All authentication dependencies are already in package.json:

- vue: ^3.5.29
- vue-router: ^5.0.3
- pinia: ^3.0.4

## Implementation Order

### Step 1: Create Type Definitions

Create types in `src/types/auth.ts`:

```typescript
// User, AuthTokens, AuthState, LoginCredentials, RegisterData, AuthResponse
```

### Step 2: Create Auth Store

Create Pinia store at `src/stores/auth.ts`:

```typescript
// State: user, isAuthenticated, isLoading, error
// Actions: login(), register(), logout(), refreshToken(), initializeAuth()
// Getters: isAuthenticated
```

### Step 3: Create Auth Service

Create API service at `src/services/auth.service.ts`:

```typescript
// register(email, password): Promise<AuthResponse>
// login(email, password): Promise<AuthResponse>
// refreshToken(refreshToken): Promise<Tokens>
// logout(): Promise<void>
```

### Step 4: Create API Interceptor

Create API service at `src/services/api.service.ts`:

```typescript
// Axios instance with interceptors
// Request: add Authorization header
// Response: check token expiry, trigger refresh if needed
```

### Step 5: Create Login View

Create `src/views/LoginView.vue`:

```vue
<script setup lang="ts">
// Form with email/password
// Validation
// Call authStore.login()
// Handle errors
</script>
```

### Step 6: Create Register View

Create `src/views/RegisterView.vue`:

```vue
<script setup lang="ts">
// Form with email/password/passwordConfirm
// Password strength validation (8+ chars, upper, lower, number)
// Call authStore.register()
// Handle success/error
</script>
```

### Step 7: Update Router

Update `src/router/index.ts`:

```typescript
// Add routes: /login, /register, /dashboard (protected)
// Add navigation guards for auth
```

### Step 8: Create Auth Components

Create components in `src/components/auth/`:

- `LoginForm.vue`
- `RegisterForm.vue`
- `LogoutButton.vue`

## Running the Application

```bash
npm run dev
```

Navigate to <http://localhost:5173>

## Testing

```bash
# Run type-check
npm run type-check

# Run unit tests
npm run test:unit

# Run linter
npm run lint
```

## Environment Variables

No additional environment variables required. The API base URL is:

```
https://taltech.akaver.com/api
```

## Key Files to Create

```
src/
├── types/
│   └── auth.ts                 # TypeScript interfaces
├── stores/
│   └── auth.ts                 # Pinia auth store
├── services/
│   ├── auth.service.ts         # Auth API calls
│   └── api.service.ts         # Axios interceptor setup
├── views/
│   ├── LoginView.vue          # Login page
│   ├── RegisterView.vue       # Registration page
│   └── DashboardView.vue      # Protected dashboard
├── components/
│   └── auth/
│       ├── LoginForm.vue      # Login form component
│       ├── RegisterForm.vue   # Registration form component
│       └── LogoutButton.vue   # Logout button component
├── router/
│   └── index.ts               # Router with auth guards
└── assets/
    └── styles/
        └── theme.css          # Dark & Gold theme variables
```

## Dark & Gold Theme Implementation

Create `src/assets/styles/theme.css`:

```css
:root {
  /* Background Colors */
  --bg-primary: #0d0d0d;
  --bg-secondary: #1a1a1a;
  --bg-card: #242424;

  /* Text Colors */
  --text-primary: #f5f5f5;
  --text-secondary: #a0a0a0;

  /* Accent Colors */
  --accent-primary: #d4af37;
  --accent-hover: #ffd700;

  /* Status Colors */
  --color-error: #dc3545;
  --color-success: #28a745;

  /* Border */
  --border-color: #333333;
}

/* Input Focus Styles */
input:focus {
  border-color: var(--accent-primary);
  outline: none;
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
}

/* Button Primary */
.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
}
```

## Multi-Tab Synchronization

The auth store should:

1. Listen for `storage` events on window
2. When logout occurs in one tab, detect via storage event
3. Clear auth state in other tabs
4. Redirect to login page

```typescript
window.addEventListener('storage', (event) => {
  if (event.key === 'authTokens' && event.newValue === null) {
    // Logout detected in another tab
    authStore.logout()
    router.push('/login')
  }
})
```
