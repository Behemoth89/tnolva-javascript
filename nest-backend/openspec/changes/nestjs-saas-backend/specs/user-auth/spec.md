## ADDED Requirements

### Requirement: User can register with email and password
The system SHALL allow new users to register with an email address and password. The password MUST be hashed using bcrypt before storage.

#### Scenario: Successful registration
- **WHEN** user submits valid email and password via POST /auth/register
- **THEN** system creates a new user record with hashed password
- **AND** system returns a JWT access token
- **AND** system returns user profile (id, email)

#### Scenario: Registration with duplicate email
- **WHEN** user submits an email that already exists
- **THEN** system returns HTTP 409 Conflict
- **AND** system includes error message about duplicate email

#### Scenario: Registration with invalid email
- **WHEN** user submits an invalid email format
- **THEN** system returns HTTP 400 Bad Request
- **AND** system includes validation error details

#### Scenario: Registration with weak password
- **WHEN** user submits a password shorter than 8 characters
- **THEN** system returns HTTP 400 Bad Request
- **AND** system includes error about minimum password length

### Requirement: User can login with email and password
The system SHALL allow registered users to authenticate with their email and password.

#### Scenario: Successful login
- **WHEN** user submits valid credentials via POST /auth/login
- **THEN** system returns a JWT access token
- **AND** system returns user profile (id, email)

#### Scenario: Login with incorrect password
- **WHEN** user submits valid email but wrong password
- **THEN** system returns HTTP 401 Unauthorized
- **AND** system includes error about invalid credentials

#### Scenario: Login with non-existent email
- **WHEN** user submits an email that does not exist
- **THEN** system returns HTTP 401 Unauthorized
- **AND** system includes error about invalid credentials

### Requirement: Authenticated user can access protected resources
The system SHALL enforce JWT authentication on protected endpoints using guards.

#### Scenario: Access with valid JWT token
- **WHEN** user makes request with valid JWT Bearer token
- **THEN** system allows access to protected resource
- **AND** system populates request user from token payload

#### Scenario: Access without JWT token
- **WHEN** user makes request without Authorization header
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Access with expired JWT token
- **WHEN** user makes request with expired JWT token
- **THEN** system returns HTTP 401 Unauthorized
- **AND** system includes error about token expiration

### Requirement: JWT token configuration from environment
The system SHALL use JWT_SECRET and JWT_EXPIRATION from environment variables.

#### Scenario: Application starts with environment variables
- **WHEN** application starts with JWT_SECRET and JWT_EXPIRATION set
- **THEN** system uses these values for token generation and validation

#### Scenario: Application starts without JWT_SECRET
- **WHEN** application starts without JWT_SECRET environment variable
- **THEN** application fails to start
- **AND** system logs error about missing JWT_SECRET
