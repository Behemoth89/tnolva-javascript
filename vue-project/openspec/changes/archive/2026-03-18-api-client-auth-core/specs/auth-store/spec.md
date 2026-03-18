## ADDED Requirements

### Requirement: Auth Store Must Manage User State

The Pinia auth store SHALL maintain the current user state.

#### Scenario: User logged in

- **WHEN** user successfully authenticates
- **THEN** auth store SHALL store the user object with id, email, and companies

#### Scenario: User logged out

- **WHEN** user logs out
- **THEN** auth store SHALL clear user state to null

#### Scenario: No user

- **WHEN** application starts with no token
- **THEN** auth store SHALL have user as null

### Requirement: Auth Store Must Manage Token State

The auth store SHALL maintain access and refresh tokens.

#### Scenario: Store tokens

- **WHEN** user authenticates successfully
- **THEN** auth store SHALL store accessToken and refreshToken

#### Scenario: Clear tokens

- **WHEN** user logs out
- **THEN** auth store SHALL clear accessToken and refreshToken

#### Scenario: No tokens

- **WHEN** application starts with no stored tokens
- **THEN** auth store SHALL have accessToken and refreshToken as null

### Requirement: Auth Store Must Track Loading State

The auth store SHALL track authentication loading state for async operations.

#### Scenario: Loading during login

- **WHEN** login request is in progress
- **THEN** auth store SHALL set isLoading to true

#### Scenario: Login complete

- **WHEN** login request completes (success or error)
- **THEN** auth store SHALL set isLoading to false

### Requirement: Auth Store Must Track Error State

The auth store SHALL track authentication errors.

#### Scenario: Login error

- **WHEN** login fails
- **THEN** auth store SHALL store error message

#### Scenario: Clear error on new attempt

- **WHEN** user starts new login attempt
- **THEN** auth store SHALL clear previous error

### Requirement: Auth Store Must Provide Authentication Status

The auth store SHALL provide computed properties for authentication status.

#### Scenario: User is authenticated

- **WHEN** user has valid access token and user object
- **THEN** isAuthenticated SHALL return true

#### Scenario: User is not authenticated

- **WHEN** user has no access token
- **THEN** isAuthenticated SHALL return false

### Requirement: Auth Store Must Decode JWT

The auth store SHALL decode JWT tokens to extract user information.

#### Scenario: Decode JWT on login

- **WHEN** access token is received
- **THEN** auth store SHALL decode JWT and populate user.companies from payload

#### Scenario: JWT decode error

- **WHEN** JWT is malformed
- **THEN** auth store SHALL handle error gracefully and set user to null
