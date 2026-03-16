# Multi-Company JWT

## Purpose

This specification defines the multi-company JWT token requirements for the NestJS SaaS backend, including the companies array in JWT payload, token refresh with company updates, and backward compatibility.

**Status**: TBD - Additional purpose details to be defined

---

## Requirements

### Requirement: JWT Token Contains Companies Array
The JWT access token SHALL contain a `companies` array with company associations and roles.

#### Scenario: JWT payload has companies array
- **WHEN** a user logs in or receives a new access token
- **THEN** the token payload SHALL include a `companies` field
- **AND** the `companies` field SHALL be an array of objects
- **AND** each object SHALL contain `companyId` and `role` properties

#### Scenario: JWT companies array structure
- **WHEN** examining the JWT token payload
- **THEN** each company entry SHALL have the structure: `{ companyId: string, role: string }`
- **AND** `companyId` SHALL be a valid UUID
- **AND** `role` SHALL be a non-empty string representing the user's role in that company

#### Scenario: Single company user has one entry
- **WHEN** a user belongs to only one company
- **THEN** the `companies` array SHALL contain exactly one entry
- **AND** the entry SHALL match the user's primary company association

### Requirement: JWT Token Refresh with Company Updates
The system SHALL support token refresh that can update the companies list without requiring re-authentication.

#### Scenario: Refresh token returns updated companies
- **WHEN** a user calls the refresh endpoint with a valid refresh token
- **AND** the user's company associations have changed
- **THEN** the new access token SHALL reflect the current companies list
- **AND** the user SHALL NOT need to re-login

#### Scenario: Refresh token with removed company
- **WHEN** a user is removed from a company
- **AND** they subsequently refresh their token
- **THEN** the new access token SHALL NOT include the removed company
- **AND** if the current company was removed, appropriate error SHALL be returned

#### Scenario: Refresh token is invalid
- **WHEN** a user calls the refresh endpoint with an invalid or expired token
- **THEN** the response SHALL return 401 Unauthorized
- **AND** the user SHALL be required to re-authenticate

### Requirement: Login Response Includes Companies
The login endpoint SHALL return the companies list in the response body.

#### Scenario: Login response structure
- **WHEN** a user successfully logs in
- **THEN** the response SHALL include an `companies` array
- **AND** each company entry SHALL include `companyId`, `role`, and `companyName`

#### Scenario: Login with multiple companies
- **WHEN** a user with multiple company associations logs in
- **THEN** the response SHALL include all their company associations
- **AND** the first company in the array SHALL be the default/active company

### Requirement: Token Payload Backward Compatibility
The JWT token SHALL maintain backward compatibility with existing single-company tokens.

#### Scenario: Legacy token still works
- **WHEN** a token with the old payload format (single companyId) is validated
- **THEN** the token SHALL still be accepted
- **AND** the user SHALL have access to the single company in the token
- **AND** the companies array SHALL be synthesized from the single companyId

### Requirement: Maximum Companies Limit
The system SHALL enforce a maximum number of companies per user.

#### Scenario: User exceeds company limit
- **WHEN** a user is associated with more companies than the configured limit
- **THEN** the system SHALL allow up to the maximum limit
- **AND** additional associations SHALL require admin intervention

#### Scenario: Companies limit configuration
- **WHEN** the system is configured with a maximum companies limit
- **THEN** the limit SHALL be configurable via environment variable
- **AND** the default limit SHALL be 50 companies per user
