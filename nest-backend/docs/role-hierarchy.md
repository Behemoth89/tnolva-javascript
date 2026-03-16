# Role Hierarchy

This document describes the role hierarchy and permissions system implemented in the application.

## Roles

The system implements a three-tier role hierarchy:

```
OWNER (level 3)
    ↓
ADMIN (level 2)
    ↓
MEMBER (level 1)
```

### Permission Levels

| Role    | Level | Description                                            |
|---------|-------|--------------------------------------------------------|
| OWNER   | 3     | Full control: can delete company, transfer ownership |
| ADMIN   | 2     | User management: can invite users, change roles      |
| MEMBER  | 1     | Basic access: read company resources                 |

## Role Hierarchy Logic

The role hierarchy is enforced through:

1. **Role Level Comparison** - Each role has a numeric level:
   - `owner = 3`
   - `admin = 2`
   - `member = 1`

2. **Permission Check** - A user has permission to perform an action if their role level >= required role level

### Example Permission Checks

```typescript
import { hasRolePermission } from './auth/guards/roles/role.guard';

// Owner can do anything
hasRolePermission('owner', 'member')  // true
hasRolePermission('owner', 'admin')   // true
hasRolePermission('owner', 'owner')   // true

// Admin can do admin and member actions
hasRolePermission('admin', 'member')  // true
hasRolePermission('admin', 'admin')   // true
hasRolePermission('admin', 'owner')    // false

// Member can only do member actions
hasRolePermission('member', 'member') // true
hasRolePermission('member', 'admin')  // false
hasRolePermission('member', 'owner')  // false
```

## Using Role Guards

### OwnerGuard
```typescript
@OwnerGuard()
@Delete(':id')
async deleteCompany() {}
```

### AdminGuard
```typescript
@AdminGuard()
@Post(':id/invitations')
async createInvitation() {}
```

### MemberGuard
```typescript
@MemberGuard()
@Get(':id/users')
async listUsers() {}
```

## Important Notes

1. **X-Company-Id Header**: All role-protected endpoints require the `x-company-id` header to identify which company context the user is acting in.

2. **Last Owner Protection**: The system prevents the removal of the last owner from a company to prevent orphan companies.

3. **Role Modification**: Only owners can assign the owner role. Admins can assign admin and member roles.

4. **Ownership Transfer**: Only owners can transfer ownership to another user. The transfer is atomic - the current owner becomes an admin and the new owner takes over.
