## Why

Users need a way to authenticate with the application. The backend authentication system is ready, but there are no frontend login or registration pages. This is essential for demonstrating backend-frontend communication and enabling user access to the application.

## What Changes

- **Login Page**: Create login form with email and password fields, loading state, error display, and navigation to register page
- **Register Page**: Create registration form with email, password, confirm password, first name, last name, and optional company name
- **Form Validation**: Implement client-side validation for required fields, email format, password minimum length
- **Auth Integration**: Connect forms to auth store and API client for authentication
- **Navigation**: Add routes for login and register pages

## Capabilities

### New Capabilities

- `login-page`: Login form with email/password authentication
- `register-page`: Registration form with user details and optional company creation

### Modified Capabilities

- None

## Impact

- **New Files**: `src/views/LoginView.vue`, `src/views/RegisterView.vue`
- **Dependencies**: Vue Router routes configuration
- **Stores**: Uses existing auth store from api-client-auth-core
- **API**: Uses API client from api-client-auth-core
