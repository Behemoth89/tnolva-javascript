## ADDED Requirements

### Requirement: Admin can invite users to company
The system SHALL allow ADMIN users to send invitations to join their company.

#### Scenario: Admin sends invitation
- **WHEN** an ADMIN calls POST /companies/:id/invite with an email address
- **AND** the email is not already associated with the company
- **THEN** the system SHALL create an invitation record with a unique token
- **AND** the system SHALL set the invitation expiry to 24 hours from creation

#### Scenario: Admin invites existing company member
- **WHEN** an ADMIN calls POST /companies/:id/invite with an email that is already a member
- **THEN** the system SHALL return HTTP 409 Conflict

#### Scenario: Non-admin tries to invite
- **WHEN** a MEMBER calls POST /companies/:id/invite
- **THEN** the system SHALL return HTTP 403 Forbidden

### Requirement: Invitation acceptance
Invited users SHALL be able to accept invitations and join the company.

#### Scenario: Accept valid invitation
- **WHEN** a user calls POST /companies/:id/invitations/:token/accept
- **AND** the invitation token is valid (exists, not used, not expired)
- **THEN** the system SHALL create a UserCompany record with MEMBER role
- **AND** the system SHALL mark the invitation as used

#### Scenario: Accept invitation for non-existent user
- **WHEN** a user who does not exist calls POST /companies/:id/invitations/:token/accept
- **AND** the invitation token is valid
- **THEN** the system SHALL require user registration first

#### Scenario: Accept invitation with invalid token
- **WHEN** a user calls POST /companies/:id/invitations/:invalid-token/accept
- **THEN** the system SHALL return HTTP 404 Not Found

### Requirement: Invitation token security
Invitation tokens SHALL be cryptographically secure and have limited validity.

#### Scenario: Token is cryptographically random
- **WHEN** an invitation is created
- **THEN** the token SHALL be at least 32 characters of random characters

#### Scenario: Invitation expires after 24 hours
- **WHEN** a user attempts to use an invitation older than 24 hours
- **THEN** the system SHALL return HTTP 400 Bad Request

#### Scenario: Invitation can only be used once
- **WHEN** a user attempts to reuse an invitation token
- **THEN** the system SHALL return HTTP 400 Bad Request

### Requirement: List pending invitations
Admins SHALL be able to view pending invitations for their company.

#### Scenario: Admin lists invitations
- **WHEN** an ADMIN calls GET /companies/:id/invitations
- **THEN** the system SHALL return a list of pending invitations
- **AND** each invitation SHALL exclude the token for security

#### Scenario: Member lists invitations
- **WHEN** a MEMBER calls GET /companies/:id/invitations
- **THEN** the system SHALL return HTTP 403 Forbidden

### Requirement: Cancel invitation
Admins SHALL be able to cancel pending invitations.

#### Scenario: Admin cancels invitation
- **WHEN** an ADMIN calls DELETE /companies/:id/invitations/:invitationId
- **THEN** the system SHALL mark the invitation as cancelled
- **AND** the token SHALL no longer be usable
