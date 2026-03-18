## ADDED Requirements

### Requirement: User Interface Must Define User Structure

The system SHALL define a TypeScript interface for User that matches the backend response.

#### Scenario: User with single company

- **WHEN** backend returns user with one company association
- **THEN** User interface SHALL include id, email, and companies array with one entry

#### Scenario: User with multiple companies

- **WHEN** backend returns user with multiple company associations
- **THEN** User interface SHALL include companies array with multiple entries

### Requirement: Company Association Interface Must Define Role

The system SHALL define a TypeScript interface for CompanyAssociation that includes companyId and role.

#### Scenario: Company association with admin role

- **WHEN** user has admin role in company
- **THEN** CompanyAssociation SHALL have role: "admin"

#### Scenario: Company association with owner role

- **WHEN** user has owner role in company
- **THEN** CompanyAssociation SHALL have role: "owner"

#### Scenario: Company association with member role

- **WHEN** user has member role in company
- **THEN** CompanyAssociation SHALL have role: "member"

### Requirement: JWT Payload Interface Must Include Required Fields

The system SHALL define a TypeScript interface for JWTPayload based on backend token structure.

#### Scenario: JWT payload structure

- **WHEN** JWT is decoded
- **THEN** JWTPayload SHALL include sub (user ID), email, companyId, and companies array

#### Scenario: JWT with null companyId

- **WHEN** user has no selected company
- **THEN** JWTPayload.companyId SHALL be null

### Requirement: API Response Wrapper Interface Must Be Generic

The system SHALL define a generic ApiResponse interface that wraps all API responses.

#### Scenario: Success response

- **WHEN** API returns successful response
- **THEN** ApiResponse<T> SHALL have success: true, data: T

#### Scenario: Error response

- **WHEN** API returns error response
- **THEN** ApiResponse<T> SHALL have success: false, data: null, message: string

### Requirement: Login Request Interface Must Match Backend

The system SHALL define a LoginRequest interface matching the backend DTO.

#### Scenario: Login with optional companyId

- **WHEN** user logs in
- **THEN** LoginRequest SHALL have email, password, and optional companyId

### Requirement: Register Request Interface Must Match Backend

The system SHALL define a RegisterRequest interface matching the backend DTO.

#### Scenario: Register with company name

- **WHEN** user registers with company name
- **THEN** RegisterRequest SHALL have email, password, firstName, lastName, and optional companyName

### Requirement: Auth Response Interface Must Include Tokens

The system SHALL define an AuthResponse interface that includes user and tokens.

#### Scenario: Auth response structure

- **WHEN** login/register succeeds
- **THEN** AuthResponse SHALL have user, accessToken, and refreshToken
