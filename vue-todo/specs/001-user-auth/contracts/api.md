# API Contracts: Authentication

Base URL: `https://taltech.akaver.com/api/v1`

## Endpoints

### POST /Account/Register

Register a new user account.

**Endpoint**: `/api/v1/Account/Register`

**Query Parameters**:

- `expiresInSeconds` (optional): Token expiration time in seconds

**Request:**

```typescript
interface RegisterRequest {
  email: string
  password: string
  firstName?: string // optional
  lastName?: string // optional
}
```

**Response (201 Created):**

```typescript
interface JwtResponse {
  token: string // JWT access token
  refreshToken: string
  firstName: string | null
  lastName: string | null
}
```

**Error Responses:**

- 400 Bad Request: Invalid email format or weak password
- 404 Not Found: Email already registered

---

### POST /Account/Login

Authenticate an existing user.

**Endpoint**: `/api/v1/Account/Login`

**Query Parameters**:

- `expiresInSeconds` (optional): Token expiration time in seconds

**Request:**

```typescript
interface LoginRequest {
  email: string
  password: string
}
```

**Response (200 OK):**

```typescript
interface JwtResponse {
  token: string // JWT access token
  refreshToken: string
  firstName: string | null
  lastName: string | null
}
```

**Error Responses:**

- 400 Bad Request: Missing credentials
- 404 Not Found: Invalid email or password

---

### POST /Account/RefreshToken

Refresh an expired or expiring access token.

**Endpoint**: `/api/v1/Account/RefreshToken`

**Query Parameters**:

- `expiresInSeconds` (optional): Token expiration time in seconds

**Request:**

```typescript
interface RefreshTokenRequest {
  jwt: string // current/expired access token
  refreshToken: string
}
```

**Response (200 OK):**

```typescript
interface JwtResponse {
  token: string // new JWT access token
  refreshToken: string
  firstName: string | null
  lastName: string | null
}
```

**Error Responses:**

- 400 Bad Request: Missing tokens
- 401 Unauthorized: Invalid or expired refresh token

---

## Client-Side API Client

### Requirements

1. All requests must include `Content-Type: application/json`
2. Access token must be included in `Authorization: Bearer <token>` header for protected endpoints
3. Handle 401 responses by redirecting to login
4. Proactively refresh tokens when <50% lifetime remaining (note: token expiration must be tracked client-side via expiresInSeconds)

### JWT Token Handling

- The API does NOT return explicit expiration timestamps
- Use `expiresInSeconds` query parameter when calling login/register/refresh to know token lifetime
- Default expiration is server-side, but client can request specific duration

### Error Handling

```typescript
interface ApiError {
  messages: string[] // Array of error messages from server
}
```
