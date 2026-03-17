## Why

The access tokens will expire after a short period. Users need seamless token refresh without having to re-login. The backend provides two refresh mechanisms: using the refresh token or refreshing the JWT with current token. This ensures continuous authenticated sessions.

## What Changes

- **Auto-Refresh on 401**: Implement automatic token refresh when API returns 401 Unauthorized
- **Refresh Token Endpoint**: Use POST /api/v1/auth/refresh with refresh token
- **JWT Refresh Endpoint**: Use POST /api/v1/auth/refresh-jwt to get updated token
- **Token Update**: Update stored tokens in auth store after successful refresh
- **Logout on Failure**: Redirect to login if refresh fails

## Capabilities

### New Capabilities

- `token-refresh`: Automatic token refresh mechanism

### Modified Capabilities

- None

## Impact

- **Files Modified**: `src/api/client.ts`, `src/stores/auth.ts`
- **Dependencies**: None (uses existing API client)
