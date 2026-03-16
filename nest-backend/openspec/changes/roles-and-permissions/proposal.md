## Why

The current multi-tenant SaaS platform lacks a formal roles and permissions system. While the UserCompany entity has basic role support (ADMIN, MEMBER, VIEWER), there is no clear ownership model, permission hierarchy, or role-based access control guards. This prevents proper authorization enforcement across company resources and leaves critical operations unprotected.

## What Changes

- Add OWNER role to UserCompany entity (replacing/adjusting existing roles)
- Implement role hierarchy: OWNER > ADMIN > MEMBER
- Create role-based guards that validate permissions per-company using X-Company-Id header
- Add ownership transfer capability (Owner transfers to another user, becomes Admin)
- Implement company invitation system (Admins invite users, invited users become Members)
- Add role management endpoints (update role, remove user from company)
- Company deletion: Owner can soft-delete, only Super Admin can hard-delete
- Update JWT to include role information per company

## Capabilities

### New Capabilities

- `company-roles`: Defines roles hierarchy (Owner/Admin/Member), role permissions matrix, and ownership transfer logic
- `role-guards`: Implements JWT-based role guards that check X-Company-Id header and validates user's role from JWT companies array
- `company-invitations`: Handles invitation workflow - Admins invite users, invitation tokens, invited user becomes Member by default

### Modified Capabilities

- `user-auth`: JWT payload structure will include role per company in the companies array
- `company-management`: Add role-based access control to company CRUD operations, ownership transfer endpoint

## Impact

- **Entities Modified**: UserCompany entity (add OWNER role)
- **New Guards**: RoleGuard, OwnerGuard, AdminGuard decorators
- **New Endpoints**: POST /companies/:id/invite, POST /companies/:id/transfer-ownership, PATCH /companies/:id/users/:userId/role
- **JWT Changes**: Token payload companies array includes role field
- **Dependencies**: No new external dependencies required
