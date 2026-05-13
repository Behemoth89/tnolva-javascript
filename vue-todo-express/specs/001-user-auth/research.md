# Research: User Authentication for vue-todo

## Date: 2026-03-21

## Overview

Research conducted to resolve technical decisions for implementing user authentication in the vue-todo SPA against taltech.akaver.com API.

---

## Decisions Documented

### Decision 1: Client-Side Token Storage

- **Decision**: Use localStorage for JWT token persistence
- **Rationale**: Simple implementation, persists across browser sessions, aligns with spec requirements
- **Alternatives Considered**:
  - SessionStorage: Does not persist across sessions
  - Cookies: More secure against XSS but requires CSRF protection
  - Memory only: Tokens lost on page refresh

### Decision 2: Password Strength Requirements

- **Decision**: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number (OWASP baseline)
- **Rationale**: Follows OWASP baseline recommendations for password complexity
- **Alternatives Considered**:
  - Simpler rules (8 chars only): Too weak
  - Stricter rules (special chars, 12+ chars): User friction without significant security gain

### Decision 3: JWT Token Refresh Strategy

- **Decision**: Proactive refresh when token has <50% of original lifetime remaining
- **Rationale**: Prevents token expiration during active use, reduces UX interruptions
- **Alternatives Considered**:
  - Refresh on expiration: Risk of brief unavailability
  - Fixed interval refresh: May refresh unnecessarily
  - Refresh on API error: Last resort, adds latency

### Decision 4: Multi-Tab Logout Synchronization

- **Decision**: Use StorageEvent listener to detect logout and redirect all other tabs to login
- **Rationale**: Real-time sync without polling, native browser API
- **Alternatives Considered**:
  - BroadcastChannel API: More modern but less widely supported
  - Polling: Inefficient, adds server load

### Decision 5: Authentication API Endpoints

- **Decision**: Use taltech.akaver.com REST API endpoints:
  - POST /api/v1/Account/Register
  - POST /api/v1/Account/Login
  - POST /api/v1/Account/RefreshToken
- **Rationale**: Provided by backend service, documented in spec assumptions
- **Alternatives Considered**:
  - Custom auth server: Out of scope
  - Third-party auth (Auth0, Firebase): Not specified in requirements

---

## Actual API Contract (from taltech-api.json)

### API Details

**Base URL**: `https://taltech.akaver.com/api/v1`

### Endpoints

#### POST /Account/Register

- **Query params**: `expiresInSeconds` (optional)
- **Request body**:

  ```json
  {
    "email": "string",
    "password": "string",
    "firstName": "string (optional)",
    "lastName": "string (optional)"
  }
  ```

- **Response**: `JwtResponse { token, refreshToken, firstName, lastName }`

#### POST /Account/Login

- **Query params**: `expiresInSeconds` (optional)
- **Request body**:

  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

- **Response**: `JwtResponse { token, refreshToken, firstName, lastName }`

#### POST /Account/RefreshToken

- **Query params**: `expiresInSeconds` (optional)
- **Request body**:

  ```json
  {
    "jwt": "current token",
    "refreshToken": "refresh token"
  }
  ```

- **Response**: `JwtResponse { token, refreshToken, firstName, lastName }`

### Key Implementation Notes

1. **Token field name**: API uses `token` not `accessToken`
2. **RefreshToken request**: Uses `{ jwt, refreshToken }` structure
3. **No explicit expiration**: Use `expiresInSeconds` query param to track token lifetime client-side
4. **User info**: Response includes `firstName` and `lastName`

---

## Technical Implementation Notes

### Vue 3 + TypeScript Authentication Flow

1. **Registration Flow**:
   - User fills registration form (email, password, optional firstName/lastName)
   - Validate password strength client-side
   - POST to /api/v1/Account/Register
   - On success: store token/refreshToken in localStorage, redirect to dashboard
   - On error: display error messages from API

2. **Login Flow**:
   - User enters credentials
   - POST to /api/v1/Account/Login
   - On success: store JWT in localStorage, redirect to dashboard
   - On error: display error message

3. **Token Refresh Flow**:
   - Use `expiresInSeconds` when making auth requests to know token lifetime
   - Check token remaining time on each API request
   - If <50% remaining: proactively refresh via /api/v1/Account/RefreshToken
   - On refresh failure: redirect to login

4. **Logout Flow**:
   - Clear localStorage tokens
   - Dispatch StorageEvent to notify other tabs
   - Redirect to login page

### Error Handling Strategy

- **Network errors**: Show "Network unavailable" message
- **Validation errors**: Display inline below relevant form fields
- **Auth failures**: Generic message without revealing which field was wrong
- **Token expiry**: Automatic redirect to login

---

## Dependencies Required

None - using existing project dependencies:

- vue: ^3.5.29
- vue-router: ^5.0.3
- pinia: ^3.0.4

---

## Conclusion

All technical decisions have been resolved. The plan has been corrected to match the actual taltech.akaver.com API contract (from taltech-api.json).

**Corrections made**:

1. Added optional `firstName`/`lastName` to Register request
2. Changed response field from `accessToken` to `token`
3. Added `firstName`/`lastName` to response
4. Corrected RefreshToken request to use `{ jwt, refreshToken }` structure
5. Added note about `expiresInSeconds` query parameter for token lifetime tracking
