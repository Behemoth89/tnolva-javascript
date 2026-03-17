## Why

The Vue frontend needs to integrate with the NestJS backend for authentication, authorization, and multi-tenant company management. Currently, the frontend has no authentication system or API client infrastructure. This foundational work is critical to enable user login, registration, and secure API communication before implementing any business features.

## What Changes

- **New API Client Module**: Create a centralized API client with base URL configuration, request/response interceptors, and automatic unwrapping of the standard API response wrapper (`{ success, data, message }`)
- **Authentication State Management**: Implement Pinia store for auth state (user, tokens, loading, error states)
- **JWT Token Handling**: Decode JWT tokens to extract user ID, email, companies array, and current company ID
- **TypeScript Interfaces**: Define complete TypeScript interfaces for all API response types based on backend specs
- **Error Handling**: Implement standardized error handling for common HTTP status codes (400, 401, 403, 404, 409)

## Capabilities

### New Capabilities

- `api-client`: Centralized API client with auth header injection, response unwrapping, and error handling
- `auth-store`: Pinia store managing authentication state, user data, and token storage
- `auth-types`: TypeScript interfaces for User, Company, Role, JWT payload, and API response types

### Modified Capabilities

- None - this is the initial implementation

## Impact

- **New Files**: `src/api/client.ts`, `src/api/types.ts`, `src/stores/auth.ts`
- **Dependencies**: axios or native fetch (will use native fetch per backend guide)
- **Configuration**: Environment variables for API base URL
