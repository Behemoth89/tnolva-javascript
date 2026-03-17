## ADDED Requirements

### Requirement: Auth Store Must Provide Current Role

The auth store SHALL provide the user's current role.

#### Scenario: Get current role

- **WHEN** user has selected company
- **THEN** currentRole getter SHALL return user's role in that company

#### Scenario: No company selected

- **WHEN** no company is selected
- **THEN** currentRole SHALL return null

### Requirement: Route Guards Must Check Authentication

The router SHALL redirect unauthenticated users to login.

#### Scenario: Unauthenticated user

- **WHEN** user navigates to protected route without token
- **THEN** user SHALL be redirected to /login

### Requirement: Route Guards Must Check Role

The router SHALL enforce role-based route access.

#### Scenario: User lacks required role

- **WHEN** user navigates to route requiring higher role
- **THEN** user SHALL be redirected to access denied page or home

### Requirement: Route Meta for Required Role

The router SHALL support meta field for required role.

#### Scenario: Route with role requirement

- **WHEN** route has meta.requiresRole
- **THEN** navigation guard SHALL check user's role
