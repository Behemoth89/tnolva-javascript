## ADDED Requirements

### Requirement: Company roles hierarchy
The system SHALL support a role hierarchy where OWNER > ADMIN > MEMBER, with each role inheriting permissions from lower roles.

#### Scenario: Role hierarchy enforcement
- **WHEN** a user with ADMIN role attempts to access an OWNER-only endpoint
- **THEN** the system SHALL return HTTP 403 Forbidden
- **AND** the error message SHALL indicate insufficient permissions

#### Scenario: Admin inherits member permissions
- **WHEN** a user with ADMIN role attempts to access a MEMBER-only endpoint
- **THEN** the system SHALL allow access

### Requirement: Owner role capabilities
The OWNER role SHALL have full control over the company including ownership transfer and deletion.

#### Scenario: Owner can transfer ownership
- **WHEN** an OWNER calls POST /companies/:id/transfer-ownership with a target user's email
- **AND** the target user is a member or admin of the company
- **THEN** the system SHALL update the target user's role to OWNER
- **AND** the system SHALL update the current OWNER's role to ADMIN

#### Scenario: Owner can soft-delete company
- **WHEN** an OWNER calls DELETE /companies/:id
- **THEN** the system SHALL soft-delete the company (set deletedAt timestamp)
- **AND** the company SHALL no longer appear in active lists

#### Scenario: Owner cannot be removed by admin
- **WHEN** an ADMIN attempts to remove an OWNER from the company
- **THEN** the system SHALL return HTTP 403 Forbidden

### Requirement: Admin role capabilities
The ADMIN role SHALL have management capabilities except ownership transfer.

#### Scenario: Admin can invite users
- **WHEN** an ADMIN calls POST /companies/:id/invite with an email
- **THEN** the system SHALL create an invitation record
- **AND** the system SHALL send an invitation email

#### Scenario: Admin can update user roles
- **WHEN** an ADMIN calls PATCH /companies/:id/users/:userId/role with a new role
- **AND** the target user is not the OWNER
- **THEN** the system SHALL update the user's role

#### Scenario: Admin cannot change owner role
- **WHEN** an ADMIN attempts to update the OWNER's role
- **THEN** the system SHALL return HTTP 403 Forbidden

### Requirement: Member role capabilities
The MEMBER role SHALL have basic access to company resources.

#### Scenario: Member can access company resources
- **WHEN** a MEMBER calls GET /companies/:id
- **THEN** the system SHALL return the company details

#### Scenario: Member cannot invite users
- **WHEN** a MEMBER calls POST /companies/:id/invite
- **THEN** the system SHALL return HTTP 403 Forbidden

### Requirement: Invited users become members
Users who accept an invitation SHALL automatically become MEMBERs of the company.

#### Scenario: Invited user accepts invitation
- **WHEN** a user with a valid invitation token calls POST /companies/:id/invitations/:token/accept
- **AND** the invitation is valid (not used, not expired)
- **THEN** the system SHALL create a user-company association with MEMBER role
- **AND** the system SHALL mark the invitation as used

#### Scenario: Invitation already used
- **WHEN** a user attempts to use an already-used invitation token
- **THEN** the system SHALL return HTTP 400 Bad Request

#### Scenario: Invitation expired
- **WHEN** a user attempts to use an expired invitation token
- **THEN** the system SHALL return HTTP 400 Bad Request
