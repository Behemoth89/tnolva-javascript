## ADDED Requirements

### Requirement: API Client Must Detect 401 Responses

The API client SHALL detect when API returns 401 Unauthorized.

#### Scenario: 401 response received

- **WHEN** API returns 401 status code
- **THEN** API client SHALL attempt token refresh

### Requirement: API Client Must Use Refresh Token

The API client SHALL use the refresh token to get new access token.

#### Scenario: Refresh token available

- **WHEN** 401 received and refresh token exists
- **THEN** API client SHALL call POST /api/v1/auth/refresh with refreshToken

#### Scenario: Refresh successful

- **WHEN** refresh endpoint returns new tokens
- **THEN** new accessToken and refreshToken SHALL be stored

### Requirement: API Client Must Retry Original Request

The API client SHALL retry the original request after successful token refresh.

#### Scenario: Retry after refresh

- **WHEN** token refresh succeeds
- **THEN** original request SHALL be retried with new access token

### Requirement: API Client Must Handle Refresh Failure

The API client SHALL handle token refresh failure gracefully.

#### Scenario: Refresh token expired

- **WHEN** refresh endpoint returns error
- **THEN** user SHALL be redirected to login page

### Requirement: Auth Store Must Update Tokens

The auth store SHALL update stored tokens after refresh.

#### Scenario: Update tokens

- **WHEN** new tokens are received
- **THEN** auth store SHALL update accessToken and refreshToken

### Requirement: Single Refresh Attempt

The API client SHALL only attempt token refresh once per request.

#### Scenario: Refresh already attempted

- **WHEN** token refresh already attempted for this request
- **THEN** do not attempt refresh again
- **AND** redirect to login
