## ADDED Requirements

### Requirement: Company Context Header
The system SHALL use the `X-Company-Id` header to determine the active company for request-scoped operations.

#### Scenario: Request with company header
- **WHEN** a request includes the `X-Company-Id` header
- **AND** the user has access to the specified company
- **THEN** the company SHALL be set as the active company context for the request

#### Scenario: Request without company header
- **WHEN** a request does not include the `X-Company-Id` header
- **AND** the user has exactly one company
- **THEN** that company SHALL be used as the default company context

#### Scenario: Request without company header for multi-company user
- **WHEN** a request does not include the `X-Company-Id` header
- **AND** the user has multiple companies
- **THEN** the request SHALL return 400 Bad Request requiring company selection

### Requirement: Company Context Validation
The system SHALL validate that the requested company is in the user's companies list.

#### Scenario: Valid company access
- **WHEN** a user requests access to a company they are associated with
- **THEN** the request SHALL proceed with that company context

#### Scenario: Invalid company access
- **WHEN** a user requests access to a company they are NOT associated with
- **THEN** the request SHALL return 403 Forbidden
- **AND** the error message SHALL indicate lack of access

#### Scenario: Company no longer exists
- **WHEN** a user requests access to a company that has been soft deleted
- **AND** the user is not an admin
- **THEN** the request SHALL return 404 Not Found

### Requirement: Company Context Decorator
The system SHALL provide a decorator to easily access the current company context in controllers and services.

#### Scenario: Using company context decorator
- **WHEN** a controller method uses the `@CurrentCompany()` decorator
- **THEN** it SHALL return the companyId from the validated request context

#### Scenario: Company context in service
- **WHEN** a service needs to access the current company
- **THEN** it SHALL be able to inject `TenantService` to get the current companyId

### Requirement: Company Scope Guard
The system SHALL provide a guard to enforce company context validation on protected routes.

#### Scenario: Protected route requires company
- **WHEN** a protected route is accessed without valid company context
- **THEN** the guard SHALL return 403 Forbidden

#### Scenario: Public route ignores company
- **WHEN** a route is marked with `@Public()` decorator
- **THEN** the company context guard SHALL NOT block access

### Requirement: Company Switching
The system SHALL support switching the active company context without re-authentication.

#### Scenario: Switch company context
- **WHEN** a user makes a request with a different `X-Company-Id` header
- **AND** they have access to that company
- **THEN** the request SHALL proceed with the new company context
- **AND** subsequent requests with the same header SHALL use that company

#### Scenario: Concurrent company contexts
- **WHEN** multiple requests are made with different company headers
- **THEN** each request SHALL maintain its own isolated company context
- **AND** there SHALL be no cross-request contamination

### Requirement: Company Context in Responses
API responses SHALL include company context information when relevant.

#### Scenario: Response includes company info
- **WHEN** a successful response is returned
- **AND** the request had a company context
- **THEN** the response MAY include the companyId for confirmation
- **AND** the response SHALL filter data based on the company context
