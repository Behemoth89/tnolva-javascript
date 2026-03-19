## 1. Auth Store Role Getters

- [x] 1.1 Add currentRole getter to auth store
- [x] 1.2 Add isOwner() getter
- [x] 1.3 Add isAdmin() getter
- [x] 1.4 Add isMember() getter

## 2. Permission Utilities

- [x] 2.1 Create `src/utils/permissions.ts`
- [x] 2.2 Add canPerformAction(userRole, requiredRole) function
- [x] 2.3 Add roleLevel mapping (owner=3, admin=2, member=1)

## 3. Route Guards

- [x] 3.1 Add auth guard to router for protected routes
- [x] 3.2 Add role guard to router
- [x] 3.3 Define meta.requiresRole for routes

## 4. Role-Based Component

- [x] 4.1 Create `src/components/RoleGuard.vue`
- [x] 4.2 Accept requiredRole prop
- [x] 4.3 Conditionally render slot based on role

## 5. Integration

- [x] 5.1 Test route guards redirect correctly
- [x] 5.2 Test permission helper comparisons
- [x] 5.3 Test RoleGuard component
