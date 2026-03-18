## Context

The Vue 3 frontend needs to communicate with the NestJS backend for authentication and authorization. The backend implements a multi-tenant SaaS architecture with:

- JWT-based authentication with access and refresh tokens
- Multi-company tenancy requiring `X-Company-Id` header for API requests
- Role-based access control (owner, admin, member)
- Standardized API response wrapper format

Current state: Empty Vue project with Pinia, Vue Router, and TypeScript. No API client or authentication system exists.

## Goals / Non-Goals

**Goals:**

- Create centralized API client for all backend communication
- Define complete TypeScript interfaces matching backend DTOs
- Implement authentication state management in Pinia
- Handle API response unwrapping and error handling
- Decode JWT tokens to extract user/company information

**Non-Goals:**

- Login/Register UI pages (separate proposal)
- Token refresh logic (separate proposal)
- Company switching functionality (separate proposal)
- Role-based route guards (separate proposal)
- Landing page (separate proposal)

## Decisions

### 1. Native Fetch over Axios

**Decision**: Use native Fetch API instead of Axios
**Rationale**:

- Lower bundle size (no additional dependency)
- Modern browsers have excellent fetch support
- Backend guide provides fetch-based examples
- Can use fetch interceptors via wrapper functions

### 2. In-Memory Token Storage

**Decision**: Store tokens in memory (not localStorage)
**Rationale**:

- Security best practice - tokens not persisted to disk
- Backend guide recommends this approach
- Tokens cleared on page refresh (acceptable for MVP)
- Future: can add httpOnly cookie support later

### 3. JWT Decoding Without Verification

**Decision**: Decode JWT payload client-side without server verification
**Rationale**:

- Need user ID, email, companies for UI display
- Full verification happens server-side anyway
- Use `atob()` approach per backend guide

### 4. Centralized API Client Pattern

**Decision**: Single API client instance with methods for each endpoint
**Rationale**:

- Consistent request/response handling
- Easy to add auth headers to all requests
- Single place for error handling logic
- Type-safe API calls

## Risks / Trade-offs

| Risk                                  | Mitigation                                        |
| ------------------------------------- | ------------------------------------------------- |
| Tokens lost on page refresh           | Accept for MVP; can add session persistence later |
| JWT decoding fails on malformed token | Add try/catch, treat as unauthenticated           |
| No offline support                    | Accept limitation for initial release             |
| Multiple company users must re-select | Implement in company switching proposal           |

## Migration Plan

1. Create TypeScript interfaces first (contracts)
2. Implement API client with auth methods
3. Create Pinia auth store
4. Test with backend auth endpoints
5. No rollback needed - pure additive changes
