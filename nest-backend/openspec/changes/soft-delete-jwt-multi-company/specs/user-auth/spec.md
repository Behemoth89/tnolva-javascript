## MODIFIED Requirements

### Requirement: User Login Returns Companies Array
**From**: Login response returns user object with id and email
**To**: Login response returns user object with companies array

The system SHALL return a companies array in the login response to support multi-company users.

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

### Requirement: User Registration for Multi-Company
**From**: Registration creates user with single optional companyId
**To**: Registration can optionally create user with initial company

The system SHALL support creating a user with an initial company association during registration.

#### Scenario: Register with company
- **WHEN** a user registers with a companyId
- **THEN** the user SHALL be associated with that company
- **AND** the role SHALL default to "member"
- **AND** the JWT token SHALL include this company

#### Scenario: Register without company
- **WHEN** a user registers without a companyId
- **THEN** the user SHALL be created without company associations
- **AND** the user SHALL need to be added to a company later

## ADDED Requirements

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
