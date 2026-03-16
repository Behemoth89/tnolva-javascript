# Company Management

## Purpose

This specification defines the company management requirements for the NestJS SaaS backend, including Company entity, CRUD endpoints, registration with company creation, and company access validation.

**Status**: TBD - Additional purpose details to be defined

---

## Requirements

### Requirement: Company entity
The system SHALL provide a Company entity that represents an organization in the multi-tenant system.

#### Scenario: Company has required fields
- **WHEN** a company is created
- **THEN** it SHALL have a unique id (UUID), name, slug (auto-generated from name if not provided), and timestamps
- **AND** it SHALL have isActive defaulting to true

#### Scenario: Slug auto-generation
- **WHEN** a company is created with name "Acme Corporation"
- **AND** no slug is provided
- **THEN** the slug SHALL be auto-generated as "acme-corporation"
- **AND** special characters SHALL be removed or replaced (e.g., "John's Co." → "johns-co")
- **AND** spaces SHALL be replaced with hyphens

#### Scenario: Company has optional settings
- **WHEN** a company is created with settings
- **THEN** the settings SHALL be stored as a JSON object
- **AND** settings MAY include timezone, locale, or custom configuration

### Requirement: Company CRUD endpoints
The system SHALL provide RESTful endpoints for company management.

#### Scenario: Create company
- **WHEN** authenticated user with admin role sends POST /companies with name and optional slug
- **AND** the slug is not already in use
- **THEN** a new company SHALL be created
- **AND** the company SHALL be associated with the user's company context
- **AND** the response SHALL include the created company with 201 status

#### Scenario: Create company with duplicate slug
- **WHEN** authenticated user sends POST /companies with a slug that already exists
- **THEN** the system SHALL return 409 Conflict
- **AND** the error message SHALL indicate slug is taken

#### Scenario: List companies
- **WHEN** authenticated user sends GET /companies
- **THEN** the system SHALL return companies the user has access to
- **AND** companies SHALL be filtered based on user's company associations in JWT
- **AND** each company SHALL include id, name, slug (no sensitive data)

#### Scenario: Get company by ID
- **WHEN** authenticated user sends GET /companies/:id
- **AND** the user has access to the company
- **THEN** the system SHALL return the company details

#### Scenario: Get company without access
- **WHEN** authenticated user sends GET /companies/:id
- **AND** the user does NOT have access to the company
- **THEN** the system SHALL return 403 Forbidden

#### Scenario: Update company
- **WHEN** authenticated admin sends PUT /companies/:id with updated fields
- **AND** the user has admin role for that company
- **THEN** the company SHALL be updated with the new values
- **AND** the response SHALL include the updated company

#### Scenario: Update company slug to duplicate
- **WHEN** authenticated admin sends PUT /companies/:id with a slug that already exists
- **THEN** the system SHALL return 409 Conflict
- **AND** the original company SHALL remain unchanged

#### Scenario: Soft delete company
- **WHEN** authenticated admin sends DELETE /companies/:id
- **AND** the user has admin role for that company
- **THEN** the company SHALL be soft deleted (deletedAt timestamp set)
- **AND** the company SHALL no longer appear in public list
- **AND** existing user_company associations SHALL remain

#### Scenario: Restore soft deleted company
- **WHEN** authenticated admin sends POST /companies/:id/restore
- **AND** the user has admin role for that company
- **THEN** the company SHALL be restored (deletedAt set to null)
- **AND** the company SHALL reappear in lists

### Requirement: Registration with company creation
The system SHALL support creating a company during user registration.

#### Scenario: Register with company name
- **WHEN** user sends POST /auth/register with email, password, and companyName
- **THEN** a new company SHALL be created with the provided name
- **AND** the user SHALL be associated with the company as admin
- **AND** the login response SHALL include the new company in the companies array

#### Scenario: Register without company name
- **WHEN** user sends POST /auth/register with email and password (no companyName)
- **THEN** no company SHALL be created
- **AND** the user SHALL not be associated with any company
- **AND** the login response SHALL have an empty companies array

### Requirement: Company access validation
The system SHALL enforce that users can only access companies they are associated with.

#### Scenario: Access company not in user list
- **WHEN** authenticated user sends a request for company :id
- **AND** the company :id is NOT in the user's JWT companies array
- **THEN** the request SHALL return 403 Forbidden
