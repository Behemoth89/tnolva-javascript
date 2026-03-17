## Why

The backend enforces role-based access control with three roles: owner, admin, and member. The frontend needs to implement role-based route guards to protect routes based on user role, and show/hide UI elements based on permissions. This ensures users only see and can access what they're authorized for.

## What Changes

- **Role Getters**: Add methods to get current role from auth store
- **Route Guards**: Add navigation guards to protect routes by role
- **Permission Helper**: Create utility function to check if user can perform action
- **Role-Based Components**: Create components or directives to show/hide based on role

## Capabilities

### New Capabilities

- `role-guards`: Vue Router navigation guards for role-based access
- `permission-helpers`: Utility functions for role checking

### Modified Capabilities

- `auth-store`: Add role getters

## Impact

- **Files Modified**: `src/stores/auth.ts`, `src/router/index.ts`
- **New Files**: `src/utils/permissions.ts`, `src/components/RoleGuard.vue`
