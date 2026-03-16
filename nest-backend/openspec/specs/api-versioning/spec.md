# API Versioning

## Purpose

This specification defines the API versioning requirements for the NestJS SaaS backend, including URL-based versioning, Swagger documentation per version, and multiple version support.

**Status**: TBD - Additional purpose details to be defined

---

## Requirements

### Requirement: API version prefix in URL
All API endpoints SHALL be served under the versioned URL prefix `/api/v1/`.

#### Scenario: Authenticated request to versioned endpoint
- **WHEN** client makes a GET request to `/api/v1/users` with valid JWT Bearer token
- **THEN** the request is routed to the users controller and returns user data

#### Scenario: Request without version prefix
- **WHEN** client makes a GET request to `/api/users` (without version)
- **THEN** the server returns 404 Not Found

### Requirement: Swagger documentation per version
The Swagger/OpenAPI documentation SHALL be accessible at `/api/docs/v1` and display the version identifier.

#### Scenario: Accessing v1 API docs
- **WHEN** user navigates to `/api/docs/v1`
- **THEN** Swagger UI displays API documentation with version "v1" indicated

#### Scenario: API docs show correct base path
- **WHEN** Swagger documentation is generated for v1
- **THEN** all endpoint paths show the `/api/v1/` prefix in the documentation

### Requirement: Default version configuration
When no version is specified, the system SHALL use version 1 as the default.

#### Scenario: Default version behavior
- **WHEN** client makes request to `/api/v1/users` or `/api/users` with default configuration
- **THEN** v1 endpoints are served when available (404 if endpoint doesn't exist in v1)

### Requirement: Multiple version support
The system SHALL support serving multiple API versions simultaneously.

#### Scenario: Running multiple versions
- **WHEN** v1 and v2 are both enabled in configuration
- **THEN** requests to `/api/v1/*` and `/api/v2/*` are routed to their respective handlers
