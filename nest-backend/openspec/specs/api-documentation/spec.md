# API Documentation

## Purpose

This specification defines the API documentation requirements for the NestJS SaaS backend, including Swagger UI integration, OpenAPI specification, and proper decorators for all endpoints.

**Status**: TBD - Additional purpose details to be defined

---

## Requirements

### Requirement: Swagger UI available at /api/docs
The system SHALL serve Swagger UI for API documentation at the /api/docs endpoint.

#### Scenario: Swagger UI endpoint
- **WHEN** user navigates to /api/docs in a browser
- **THEN** system displays Swagger UI with all API endpoints

#### Scenario: OpenAPI JSON endpoint
- **WHEN** user requests /api/docs-json
- **THEN** system returns OpenAPI 3.0 JSON specification

### Requirement: All endpoints have Swagger decorators
All API endpoints MUST include proper @nestjs/swagger decorators for documentation.

#### Scenario: Controller has ApiTags
- **WHEN** a controller is created
- **THEN** it MUST have @ApiTags decorator with descriptive tag

#### Scenario: Endpoint has ApiOperation
- **WHEN** an endpoint handler is created
- **THEN** it MUST have @ApiOperation decorator with summary and description

#### Scenario: Endpoint has ApiResponse
- **WHEN** an endpoint handler is created
- **THEN** it MUST have @ApiResponse decorators for success and error responses

#### Scenario: DTO has ApiProperty
- **WHEN** a DTO class is created
- **THEN** it MUST have @ApiProperty decorators on all properties

### Requirement: Swagger configuration from environment
The Swagger documentation MUST be configurable via environment variables.

#### Scenario: Swagger title and version
- **WHEN** application starts
- **THEN** Swagger UI displays title and version from configuration
- **AND** these values come from environment variables or config

### Requirement: Protected endpoints marked in Swagger
Protected endpoints that require authentication MUST be clearly marked in Swagger UI.

#### Scenario: Protected endpoint security
- **WHEN** an endpoint uses AuthGuard
- **THEN** Swagger UI shows the lock icon
- **AND** security requirement is documented in OpenAPI spec
