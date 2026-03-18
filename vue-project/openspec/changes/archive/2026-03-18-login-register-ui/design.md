## Context

The application needs login and registration pages to authenticate users. The backend authentication endpoints are ready:

- POST /api/v1/auth/login - returns user + tokens
- POST /api/v1/auth/register - creates user + company + tokens

Frontend dependencies already in place:

- API client from api-client-auth-core
- Auth store from api-client-auth-core
- Vue Router installed

## Goals / Non-Goals

**Goals:**

- Create functional login page with email/password
- Create functional register page with user details
- Implement form validation
- Connect to auth store for authentication
- Handle loading and error states
- Navigate to protected page on success

**Non-Goals:**

- Token refresh logic (separate proposal)
- Company selection UI (separate proposal)
- Role-based access control (separate proposal)
- Password strength meter
- Remember me functionality

## Decisions

### 1. Simple Form Validation

**Decision**: Use manual validation instead of form library
**Rationale**:

- Keep dependencies minimal
- Simple validation rules (required, email format, password min length)
- More control over UX

### 2. In-Component Form State

**Decision**: Store form state in Vue component ref
**Rationale**:

- Simple forms, no need for external state
- Easy to reset on navigation
- Form data stays with the view

### 3. Redirect to Dashboard on Success

**Decision**: After successful login/register, redirect to main application
**Rationale**:

- Standard UX pattern
- Dashboard will handle company selection if needed

## Risks / Trade-offs

| Risk                  | Mitigation                       |
| --------------------- | -------------------------------- |
| Backend not available | Show clear error message         |
| Network failure       | Show retry option                |
| Invalid credentials   | Show specific error from backend |

## Migration Plan

1. Create LoginView.vue component
2. Create RegisterView.vue component
3. Add routes to router configuration
4. Test end-to-end authentication flow
