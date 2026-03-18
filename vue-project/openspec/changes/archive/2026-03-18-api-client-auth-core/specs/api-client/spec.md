## ADDED Requirements

### Requirement: API Client Must Handle Base URL Configuration

The API client SHALL accept a base URL configuration for the backend API.

#### Scenario: Environment variable base URL

- **WHEN** API client is initialized without explicit base URL
- **AND** `VITE_API_BASE_URL` environment variable is set
- **THEN** it SHALL use the value from `VITE_API_BASE_URL`

#### Scenario: Default base URL (fallback)

- **WHEN** API client is initialized without explicit base URL
- **AND** `VITE_API_BASE_URL` environment variable is not set
- **THEN** it SHALL use the fallback default `http://localhost:3000/api/v1`

#### Scenario: Custom base URL

- **WHEN** API client is initialized with custom base URL
- **THEN** it SHALL use the provided base URL for all requests

### Requirement: API Client Must Include Authorization Header

The API client SHALL automatically include the Bearer token in Authorization header for authenticated requests.

#### Scenario: Request with access token

- **WHEN** API client makes a request with an access token
- **THEN** it SHALL include header `Authorization: Bearer <access_token>`

#### Scenario: Request without access token

- **WHEN** API client makes a request without an access token
- **THEN** it SHALL NOT include Authorization header

### Requirement: API Client Must Include Company Header

The API client SHALL include X-Company-Id header when a company ID is selected.

#### Scenario: Request with selected company

- **WHEN** API client has a selected company ID
- **THEN** it SHALL include header `X-Company-Id: <company_id>`

#### Scenario: Request without selected company

- **WHEN** API client has no selected company ID
- **THEN** it SHALL NOT include X-Company-Id header

### Requirement: API Client Must Unwrap API Responses

The API client SHALL unwrap the standard API response wrapper and return the data field.

#### Scenario: Successful response

- **WHEN** API returns `{ success: true, data: <payload> }`
- **THEN** API client SHALL return `<payload>` directly

#### Scenario: Error response

- **WHEN** API returns `{ success: false, message: "error" }`
- **THEN** API client SHALL throw an error with the message

### Requirement: API Client Must Handle HTTP Errors

The API client SHALL handle common HTTP error status codes and convert them to meaningful errors.

#### Scenario: 401 Unauthorized

- **WHEN** API returns 401 status code
- **THEN** API client SHALL throw error with "Unauthorized" message

#### Scenario: 403 Forbidden

- **WHEN** API returns 403 status code
- **THEN** API client SHALL throw error with "Forbidden" message

#### Scenario: 400 Bad Request

- **WHEN** API returns 400 status code
- **THEN** API client SHALL throw error with the API message

### Requirement: API Client Must Support All HTTP Methods

The API client SHALL support GET, POST, PUT, PATCH, and DELETE methods.

#### Scenario: GET request

- **WHEN** client makes GET request to endpoint
- **THEN** it SHALL make HTTP GET request with appropriate headers

#### Scenario: POST request

- **WHEN** client makes POST request with body
- **THEN** it SHALL make HTTP POST request with JSON body and appropriate headers

#### Scenario: PUT request

- **WHEN** client makes PUT request with body
- **THEN** it SHALL make HTTP PUT request with JSON body and appropriate headers

#### Scenario: PATCH request

- **WHEN** client makes PATCH request with body
- **THEN** it SHALL make HTTP PATCH request with JSON body and appropriate headers

#### Scenario: DELETE request

- **WHEN** client makes DELETE request
- **THEN** it SHALL make HTTP DELETE request with appropriate headers
