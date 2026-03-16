# Refresh Token Authentication Specification

## Overview

This spec defines the refresh token authentication system for persistent user sessions.

## Database Schema

### refresh_tokens Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| userId | UUID | FOREIGN KEY → users(id), NOT NULL, INDEX | User owning this token |
| token | VARCHAR(64) | NOT NULL, INDEX | SHA-256 hash of refresh token |
| expiresAt | TIMESTAMPTZ | NOT NULL, INDEX | Token expiration timestamp |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Token creation timestamp |
| revokedAt | TIMESTAMPTZ | NULLABLE | Token revocation timestamp |

## Token Lifecycle

### Token Creation
- Generate 32-byte random token using crypto.randomBytes()
- Hash token with SHA-256 for storage
- Set expiration to 7 days from creation
- Save to database with userId association

### Token Validation
1. Hash incoming token with SHA-256
2. Query database for matching hash
3. Check if token is expired (current time > expiresAt)
4. Check if token is revoked (revokedAt is not null)
5. Return null if any check fails

### Token Rotation
1. Validate current token
2. If valid, mark current token as revoked (set revokedAt)
3. Create new token with new expiration
4. Return new token to client

### Token Revocation
1. Hash incoming token
2. Update row setting revokedAt = now()
3. Return success/failure count

## API Endpoints

### POST /auth/login
- **Input**: { email, password, companyId? }
- **Output**: { user, accessToken, refreshToken }
- **Behavior**: Creates new refresh token on successful login

### POST /auth/refresh
- **Input**: { refreshToken } (body or cookie)
- **Output**: { accessToken, refreshToken }
- **Behavior**: Rotates refresh token, returns new pair
- **Auth**: None required (uses refresh token instead of JWT)

### POST /auth/logout
- **Input**: { refreshToken } (body or cookie)
- **Output**: { message: "Logged out successfully" }
- **Behavior**: Revokes the provided refresh token

### POST /auth/logout-all
- **Input**: None (uses authenticated user)
- **Output**: { message: "Logged out from all devices", count }
- **Behavior**: Revokes all refresh tokens for current user
- **Auth**: JWT required

## Security Requirements

- Tokens MUST be stored as SHA-256 hashes (never plain text)
- Token comparison MUST use constant-time algorithms
- Failed refresh attempts MUST be logged
- Expired/revoked tokens MUST return 401 Unauthorized

## Acceptance Criteria

1. Users can login and receive both accessToken and refreshToken
2. Users can refresh their session using refreshToken without re-authenticating
3. Each refresh rotates the token (old token becomes invalid)
4. Users can logout to invalidate their refresh token
5. Users can logout from all devices simultaneously
6. Refresh tokens expire after 7 days
7. Token storage is hashed using SHA-256
