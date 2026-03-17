## Context

Token refresh is critical for maintaining authenticated sessions. The backend provides:

- POST /api/v1/auth/refresh - uses refresh token to get new access + refresh tokens
- POST /api/v1/auth/refresh-jwt - uses current access token to get new access token

## Goals / Non-Goals

**Goals:**

- Auto-refresh tokens on 401 response
- Update tokens in auth store
- Retry failed request after refresh
- Handle refresh failures gracefully

**Non-Goals:**

- Token refresh UI (automatic process)
- Remember me functionality
- Token refresh on startup

## Decisions

### 1. Intercept 401 Responses

**Decision**: Handle token refresh in API client response handling
**Rationale**:

- Centralized location
- Can retry original request after refresh
- No duplicate refresh calls

### 2. Single Refresh Attempt

**Decision**: Only attempt refresh once per failed request
**Rationale**:

- Prevent infinite loops
- If refresh fails, user must re-login

## Risks / Trade-offs

| Risk                         | Mitigation                   |
| ---------------------------- | ---------------------------- |
| Refresh token expired        | Redirect to login            |
| Network error during refresh | Redirect to login            |
| Infinite loop                | Single refresh attempt limit |
