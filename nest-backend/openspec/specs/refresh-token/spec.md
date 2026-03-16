# Refresh Token Authentication

## Purpose

This specification defines the refresh token authentication system for persistent user sessions in the NestJS SaaS backend, including token lifecycle, API endpoints, and security requirements.

**Status**: TBD - Additional purpose details to be defined

---

## Requirements

### Requirement: Refresh token database storage
The system SHALL store refresh tokens in the database with proper schema.

#### Scenario: Refresh token table structure
- **WHEN** refresh token table is created
- **THEN** it includes id (UUID), userId (FK), token (SHA-256 hash), expiresAt, createdAt, revokedAt columns

### Requirement: Token generation
The system SHALL generate secure refresh tokens.

#### Scenario: Token creation
- **WHEN** user logs in successfully
- **THEN** system generates 32-byte random token
- **AND** token is hashed with SHA-256 for storage
- **AND** expiration is set to 7 days from creation

### Requirement: Token validation
The system SHALL validate refresh tokens before allowing session refresh.

#### Scenario: Token validation process
- **WHEN** refresh token is submitted
- **THEN** system hashes incoming token with SHA-256
- **AND** queries database for matching hash
- **AND** checks if token is expired
- **AND** checks if token is revoked
- **AND** returns null if any check fails

### Requirement: Token rotation
The system SHALL rotate refresh tokens on each use for security.

#### Scenario: Token rotation process
- **WHEN** valid refresh token is submitted to /auth/refresh
- **THEN** current token is marked as revoked
- **AND** new token is created with new expiration
- **AND** new token pair is returned to client

### Requirement: Token revocation
The system SHALL allow users to revoke their refresh tokens.

#### Scenario: Single token revocation
- **WHEN** user submits token to /auth/logout
- **THEN** token is marked as revoked
- **AND** success is returned

#### Scenario: Revoke all tokens
- **WHEN** authenticated user calls /auth/logout-all
- **THEN** all refresh tokens for current user are revoked
- **AND** count of revoked tokens is returned

### Requirement: Login creates refresh token
The system SHALL create a refresh token on successful login.

#### Scenario: Login response
- **WHEN** user POSTs to /auth/login with valid credentials
- **THEN** response includes accessToken and refreshToken

### Requirement: Refresh endpoint
The system SHALL provide an endpoint to refresh access tokens.

#### Scenario: Refresh token request
- **WHEN** user POSTs to /auth/refresh with valid refreshToken
- **AND** token is valid and not expired
- **THEN** new accessToken and refreshToken are returned
- **AND** old refresh token is revoked (rotation)

### Requirement: Logout endpoint
The system SHALL provide an endpoint to invalidate refresh tokens.

#### Scenario: Logout request
- **WHEN** user POSTs to /auth/logout with refreshToken
- **THEN** token is revoked
- **AND** success message is returned

### Requirement: Security requirements
The system SHALL implement security best practices for token handling.

#### Scenario: Token storage security
- **WHEN** refresh token is stored
- **THEN** token is hashed using SHA-256 (never plain text)

#### Scenario: Constant-time comparison
- **WHEN** tokens are compared
- **THEN** constant-time algorithm is used to prevent timing attacks

#### Scenario: Failed refresh logging
- **WHEN** refresh attempt fails
- **THEN** event is logged for security monitoring

#### Scenario: Expired/revoked token handling
- **WHEN** expired or revoked token is used
- **THEN** 401 Unauthorized is returned
