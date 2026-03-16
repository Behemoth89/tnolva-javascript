## ADDED Requirements

### Requirement: Role guards validate X-Company-Id header
Role guards SHALL validate that the user's role matches the required role for the company specified in the X-Company-Id header.

#### Scenario: Request without X-Company-Id header
- **WHEN** a protected request is made without X-Company-Id header
- **THEN** the guard SHALL return HTTP 400 Bad Request
- **AND** the error message SHALL indicate X-Company-Id is required

#### Scenario: Request with invalid company in header
- **WHEN** a protected request is made with X-Company-Id that is not in user's JWT companies array
- **THEN** the guard SHALL return HTTP 403 Forbidden
- **AND** the error message SHALL indicate access denied to that company

#### Scenario: OwnerGuard allows owner
- **WHEN** a request with valid X-Company-Id header is made by a user with OWNER role for that company
- **AND** the endpoint uses @OwnerGuard()
- **THEN** the guard SHALL allow access

#### Scenario: OwnerGuard denies non-owner
- **WHEN** a request with valid X-Company-Id header is made by a user with ADMIN role for that company
- **AND** the endpoint uses @OwnerGuard()
- **THEN** the guard SHALL return HTTP 403 Forbidden

#### Scenario: AdminGuard allows owner
- **WHEN** a request with valid X-Company-Id header is made by a user with OWNER role for that company
- **AND** the endpoint uses @AdminGuard()
- **THEN** the guard SHALL allow access (Owner inherits Admin permissions)

#### Scenario: AdminGuard denies member
- **WHEN** a request with valid X-Company-Id header is made by a user with MEMBER role for that company
- **AND** the endpoint uses @AdminGuard()
- **THEN** the guard SHALL return HTTP 403 Forbidden

#### Scenario: MemberGuard allows all roles
- **WHEN** a request with valid X-Company-Id header is made by a user with any role for that company
- **AND** the endpoint uses @MemberGuard()
- **THEN** the guard SHALL allow access

### Requirement: Role guards integrate with JWT
Role guards SHALL extract role information from the JWT payload's companies array.

#### Scenario: Guard reads role from JWT
- **WHEN** a protected request is made with valid JWT token
- **THEN** the role guard SHALL extract the role from JWT's companies array matching the X-Company-Id

#### Scenario: JWT missing company in array
- **WHEN** a JWT token does not include the requested company in its companies array
- **THEN** the guard SHALL return HTTP 403 Forbidden
- **AND** the request SHALL be blocked

### Requirement: Guard decorator usage
Role guards SHALL be usable as decorators on controller methods.

#### Scenario: Using @OwnerGuard decorator
- **WHEN** a controller method is decorated with @OwnerGuard()
- **THEN** the method SHALL require OWNER role for the X-Company-Id

#### Scenario: Using @AdminGuard decorator
- **WHEN** a controller method is decorated with @AdminGuard()
- **THEN** the method SHALL require ADMIN or OWNER role for the X-Company-Id

#### Scenario: Using @MemberGuard decorator
- **WHEN** a controller method is decorated with @MemberGuard()
- **THEN** the method SHALL require any role (MEMBER, ADMIN, or OWNER) for the X-Company-Id
