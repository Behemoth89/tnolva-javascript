## 1. Auth Store Role Getters

- [ ] 1.1 Add currentRole getter to auth store
- [ ] 1.2 Add isOwner() getter
- [ ] 1.3 Add isAdmin() getter
- [ ] 1.4 Add isMember() getter

## 2. Permission Utilities

- [ ] 2.1 Create `src/utils/permissions.ts`
- [ ] 2.2 Add canPerformAction(userRole, requiredRole) function
- [ ] 2.3 Add roleLevel mapping (owner=3, admin=2, member=1)

## 3. Route Guards

- [ ] 3.1 Add auth guard to router for protected routes
- [ ] 3.2 Add role guard to router
- [ ] 3.3 Define meta.requiresRole for routes

## 4. Role-Based Component

- [ ] 4.1 Create `src/components/RoleGuard.vue`
- [ ] 4.2 Accept requiredRole prop
- [ ] 4.3 Conditionally render slot based on role

## 5. Integration

- [ ] 5.1 Test route guards redirect correctly
- [ ] 5.2 Test permission helper comparisons
- [ ] 5.3 Test RoleGuard component
