# User Authentication

## Purpose

This specification defines the user authentication requirements for the NestJS SaaS backend, including registration, login, JWT authentication, and token configuration.

**Status**: TBD - Additional purpose details to be defined

---

## Requirements

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

#### Scenario: Register with company
- **WHEN** a user registers with a companyId
- **THEN** the user SHALL be associated with that company
- **AND** the role SHALL default to "member"
- **AND** the JWT token SHALL include this company

#### Scenario: Register without company
- **WHEN** a user registers without a companyId
- **THEN** the user SHALL be created without company associations
- **AND** the user SHALL need to be added to a company later

### Requirement: User can login with email and password
The system SHALL allow registered users to authenticate with their email and password.

#### Scenario: Successful login
- **WHEN** user submits valid credentials via POST /auth/login
- **THEN** system returns a JWT access token
- **AND** system returns user profile (id, email)
- **AND** system returns companies array

#### Scenario: Login with multiple companies
- **WHEN** a user with multiple company associations logs in
- **THEN** the response SHALL include an array of companies
- **AND** each company SHALL contain companyId, role, and companyName
- **AND** the access token SHALL include the companies in its payload

#### Scenario: Login response structure
- **WHEN** login is successful
- **THEN** the response SHALL have the structure:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "companies": [
      {
        "companyId": "uuid",
        "companyName": "Company A",
        "role": "admin"
      }
    ]
  },
  "accessToken": "eyJ..."
}
```

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

### Requirement: Token Refresh Supports Company Updates
The system SHALL provide a token refresh mechanism that can update the companies list.

#### Scenario: Refresh token endpoint
- **WHEN** a valid access token is submitted to the refresh endpoint
- **THEN** a new access token SHALL be returned
- **AND** the new token SHALL contain the current companies list
- **AND** the companies list SHALL reflect any changes since the original token

#### Scenario: Refresh token with company changes
- **WHEN** a user is added to or removed from companies
- **AND** they refresh their token
- **THEN** the new token SHALL reflect the updated companies list
