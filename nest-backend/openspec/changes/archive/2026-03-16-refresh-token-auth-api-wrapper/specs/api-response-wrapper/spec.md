# API Response Wrapper Specification

## Overview

This spec defines the standardized response wrapper for all API endpoints.

## ApiResponse Interface

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}
```

## Response Structure

### Success Response
```typescript
{
  success: true,
  data: <actual response data>,
  message?: "Optional success message",
  errors?: undefined
}
```

### Error Response
```typescript
{
  success: false,
  data: null,
  message: "Error message describing what went wrong",
  errors?: ["Detailed error 1", "Detailed error 2"]
}
```

## Interceptor Behavior

The ApiResponseInterceptor transforms all controller return values:

1. Wraps successful responses in ApiResponse format
2. Preserves error responses from exception filters
3. Does not double-wrap if response is already ApiResponse

## Global Application

The interceptor is registered globally in main.ts to apply to all routes.

## Swagger Documentation

All endpoint responses MUST show:
- The wrapper structure (ApiResponse<T>)
- The data type that wraps
- Examples of both success and error responses

## Example Responses

### GET /users - Success
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "email": "user@example.com" }
  ]
}
```

### POST /auth/login - Success
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "companies": [] },
    "accessToken": "eyJhbGc...",
    "refreshToken": "abc123..."
  }
}
```

### 401 Unauthorized - Error
```json
{
  "success": false,
  "data": null,
  "message": "Invalid credentials"
}
```

### 400 Bad Request - Error
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": ["email must be valid", "password is required"]
}
```

## Acceptance Criteria

1. All controller endpoints return ApiResponse<T> format
2. Success responses have success: true
3. Error responses have success: false
4. Errors include meaningful message
5. Validation errors include details in errors array
6. Swagger docs reflect wrapper structure
