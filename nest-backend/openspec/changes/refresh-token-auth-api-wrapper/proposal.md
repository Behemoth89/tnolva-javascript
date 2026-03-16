## Why

The current authentication system has critical limitations that impact user experience and security:

1. **No session persistence**: Users are forced to re-login every day (access token expires in 1 day) with no way to maintain sessions beyond this period
2. **No session invalidation**: There's no mechanism to logout or invalidate active sessions remotely
3. **Inconsistent API responses**: API responses lack a standardized structure across endpoints, making client-side handling inconsistent and error-prone

These gaps lead to poor user experience (frequent re-logins), security risks (no way to revoke compromised sessions), and increased development overhead (inconsistent response handling in clients).

## What Changes

### 1. Refresh Token Database Storage
- Create `refresh_tokens` table in PostgreSQL with columns: id (UUID), userId (UUID, indexed), token (VARCHAR(64), SHA-256 hashed), expiresAt (TIMESTAMP), createdAt (TIMESTAMP), revokedAt (TIMESTAMP nullable)
- Implement token rotation: each refresh request invalidates old token and issues a new one
- Set refresh token expiration to 7 days
- Store tokens in SHA-256 hashed format (never plain text)

### 2. Authentication Service Updates
- Modify `/auth/login` to return both accessToken and refreshToken
- Add `/auth/refresh` endpoint to accept refresh token, validate, rotate, and return new tokens
- Add `/auth/logout` endpoint to invalidate refresh tokens
- Add `/auth/logout-all` endpoint to invalidate all user tokens

### 3. API Response Wrapper
- Create `ApiResponse<T>` interface with success, data, message, errors fields
- Create NestJS interceptor to wrap all responses in ApiResponse format
- Update Swagger documentation to reflect standardized response structure

### 4. Error Handling
- Implement proper HTTP status codes (200, 400, 401, 404, 500)
- Add meaningful error messages
- Handle database failures gracefully

## Capabilities

### New Capabilities
- `refresh-token-auth`: Persistent session management with secure token rotation
- `api-response-wrapper`: Consistent API response structure across all endpoints

### Modified Capabilities
- `user-auth`: Extended with refresh token support and logout functionality

## Impact

- **New code**: `src/auth/entities/refresh-token.entity.ts`, `src/auth/services/refresh-token.service.ts`, `src/common/interceptors/api-response.interceptor.ts`
- **New database**: `refresh_tokens` table with foreign key to users
- **New endpoints**: `/auth/refresh`, `/auth/logout`, `/auth/logout-all`
- **Modified endpoints**: `/auth/login` (returns refreshToken), all existing endpoints (wrapped in ApiResponse)
