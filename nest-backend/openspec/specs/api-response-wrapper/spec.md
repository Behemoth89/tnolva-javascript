# API Response Wrapper

## Purpose

This specification defines the standardized response wrapper format for all API endpoints in the NestJS SaaS backend, including the ApiResponse interface, interceptor behavior, and Swagger documentation requirements.

**Status**: TBD - Additional purpose details to be defined

---

## Requirements

### Requirement: Standardized API response format
All API endpoints SHALL return responses in a standardized ApiResponse<T> format.

#### Scenario: Success response structure
- **WHEN** a controller returns successfully
- **THEN** response includes success: true
- **AND** response includes the actual data in the data field
- **AND** response MAY include an optional message

#### Scenario: Error response structure
- **WHEN** an error occurs during request processing
- **THEN** response includes success: false
- **AND** response includes data: null
- **AND** response includes a meaningful message
- **AND** response MAY include detailed errors array

### Requirement: ApiResponseInterceptor behavior
The system SHALL use an interceptor to wrap all controller responses.

#### Scenario: Interceptor wraps success responses
- **WHEN** a controller returns data successfully
- **THEN** the interceptor wraps the data in ApiResponse format
- **AND** success is set to true

#### Scenario: Interceptor preserves error responses
- **WHEN** an exception filter handles an error
- **THEN** the interceptor preserves the error response format
- **AND** does not double-wrap the response

#### Scenario: No double-wrapping
- **WHEN** controller already returns ApiResponse
- **THEN** the interceptor does not wrap it again

### Requirement: Global interceptor registration
The ApiResponseInterceptor SHALL be registered globally to apply to all routes.

#### Scenario: Global application
- **WHEN** application starts
- **THEN** the interceptor is registered in main.ts
- **AND** all routes return ApiResponse format

### Requirement: Swagger documentation for wrapper
All endpoint documentation SHALL reflect the wrapper structure.

#### Scenario: Swagger shows wrapper type
- **WHEN** Swagger documentation is generated
- **THEN** all responses show ApiResponse<T> as the return type
- **AND** the data type that wraps is documented
- **AND** examples show both success and error responses

### Requirement: Response format examples
The system SHALL return consistent response formats for common scenarios.

#### Scenario: GET success response
- **WHEN** GET /users returns successfully
- **THEN** response is { success: true, data: [...] }

#### Scenario: POST login success
- **WHEN** POST /auth/login succeeds
- **THEN** response includes user, accessToken, and refreshToken in data

#### Scenario: 401 Unauthorized error
- **WHEN** authentication fails
- **THEN** response is { success: false, data: null, message: "..." }

#### Scenario: 400 Bad Request with validation
- **WHEN** validation fails
- **THEN** response includes errors array with details
