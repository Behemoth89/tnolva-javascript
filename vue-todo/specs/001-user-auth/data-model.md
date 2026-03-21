# Data Model: User Authentication

## Entity: User

Represents an individual who can register, log in, and use the to-do application.

| Field     | Type   | Validation                                      | Description                     |
| --------- | ------ | ----------------------------------------------- | ------------------------------- |
| id        | string | auto-generated                                  | Unique user identifier          |
| email     | string | valid email format, required                    | User's email address            |
| password  | string | min 8 chars, 1 uppercase, 1 lowercase, 1 number | Plain text (hashed server-side) |
| firstName | string | optional                                        | User's first name               |
| lastName  | string | optional                                        | User's last name                |

### Relationships

- One User has many AuthenticationTokens
- One User has many Tasks (future feature)

---

## Entity: Authentication Token

Represents the JWT token used to authorize API requests.

| Field        | Type   | Validation        | Description                                             |
| ------------ | ------ | ----------------- | ------------------------------------------------------- |
| token        | string | JWT format        | JWT access token string (called "token" in API)         |
| refreshToken | string | required          | Token used for refresh                                  |
| expiresAt    | Date   | client-calculated | Expiration timestamp (calculated from expiresInSeconds) |
| issuedAt     | Date   | required          | Token issue timestamp                                   |

### Token Lifecycle

1. **Issued**: Token created at `issuedAt`
2. **Valid**: Token usable until `expiresAt`
3. **Refresh Window**: When remaining lifetime < 50%, proactively refresh
4. **Expired**: Token no longer valid, require re-authentication

---

## Entity: Auth State

Client-side authentication state managed by Pinia store.

| Field           | Type           | Description                  |
| --------------- | -------------- | ---------------------------- |
| user            | User \| null   | Currently authenticated user |
| isAuthenticated | boolean        | Whether user is logged in    |
| isLoading       | boolean        | Auth operation in progress   |
| error           | string \| null | Auth error message           |

---

## API DTOs

These match the actual taltech.akaver.com API contracts:

```typescript
// Login request
interface LoginRequest {
  email: string
  password: string
}

// Register request
interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

// JWT response (used for login, register, refresh)
interface JwtResponse {
  token: string
  refreshToken: string
  firstName: string | null
  lastName: string | null
}

// Refresh token request
interface RefreshTokenRequest {
  jwt: string
  refreshToken: string
}

// API error response
interface ApiError {
  messages: string[]
}
```

---

## Validation Rules

### Registration

- Email: Valid email format (RFC 5322)
- Password:
  - Minimum 8 characters
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 number (0-9)
- FirstName: Optional, max 50 characters
- LastName: Optional, max 50 characters

### Login

- Email: Required, valid format
- Password: Required, non-empty

---

## State Transitions

### Auth State Machine

```
┌──────────────┐     login()      ┌─────────────────┐
│   Anonymous  │ ──────────────▶  │  Authenticating │
└──────────────┘                  └────────┬────────┘
     ▲                                    │
     │ logout()                     success
     │                                    ▼
     │                            ┌─────────────────┐
     │                            │  Authenticated  │
     │                            └────────┬────────┘
     │                                     │ token expired
     │                                     ▼
     │                            ┌─────────────────┐
     └────────────────────────────│   Token Refresh │
                                  └────────┬────────┘
                                           │ failure
                                           ▼
                                    ┌─────────────────┐
                                    │   Anonymous     │
                                    └──────────────────┘
```

---

## TypeScript Interfaces

```typescript
interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

interface AuthTokens {
  token: string
  refreshToken: string
  expiresAt: Date
  issuedAt: Date
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  passwordConfirm: string
  firstName?: string
  lastName?: string
}

interface AuthResponse {
  user: User
  tokens: AuthTokens
}
```
