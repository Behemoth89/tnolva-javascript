## Context

The multi-tenant SaaS platform currently lacks a formal roles and permissions system. While the `UserCompany` entity has basic role support (ADMIN, MEMBER, VIEWER), there is no clear ownership model or role-based access control guards. The JWT token already includes a `companies` array with role information, but role validation is not consistently enforced at the API level.

The system needs to support:
- Per-company role assignments (OWNER, ADMIN, MEMBER)
- Role-based authorization guards that check the X-Company-Id header
- Ownership transfer capabilities
- Company invitation system

Current state:
- [`UserCompany`](src/users/entities/user-company.entity.ts:10) entity has roles: ADMIN, MEMBER, VIEWER
- [`JwtStrategy`](src/auth/strategies/jwt.strategy.ts:12) validates companies array with role
- [`TenantGuard`](src/common/guards/tenant.guard.ts:19) validates company access but not role
- Company creation in [`CompaniesService.createWithUser()`](src/companies/services/companies.service.ts:189) assigns 'admin' role

## Goals / Non-Goals

**Goals:**
- Implement role hierarchy: OWNER > ADMIN > MEMBER
- Create role-based guards (OwnerGuard, AdminGuard, MemberGuard)
- Add ownership transfer endpoint (Owner → transfer → new Owner, old Owner becomes Admin)
- Implement company invitation system (Admins invite users, invited users become Members)
- Add role management endpoints (update user role, remove user from company)
- Role-based company deletion (Owner soft-delete, Super Admin hard-delete)

**Non-Goals:**
- Cross-company permissions (permissions within a company only)
- Fine-grained resource-level permissions (entity-level ACL)
- Super Admin dashboard/management (future enhancement)
- Role change notifications (future enhancement)

## Decisions

### 1. Role Enum Values
**Decision:** Use enum values: `OWNER`, `ADMIN`, `MEMBER`

**Rationale:** 
- Replace existing `UserCompanyRole` enum with explicit roles
- OWNER replaces "founder" concept - one per company
- ADMIN has most management capabilities except ownership transfer
- MEMBER is default for invited users

**Alternative Considered:**
- Keep existing ADMIN/MEMBER/VIEWER: Rejected because VIEWER is not needed and OWNER role is required for clear ownership

### 2. Guard Implementation Pattern
**Decision:** Create role guards that check both X-Company-Id header AND JWT companies array

```typescript
// src/auth/guards/roles/owner.guard.ts
@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const companyId = request.headers['x-company-id'];
    const user = request.user;

    if (!companyId) {
      throw new BadRequestException('X-Company-Id header required');
    }

    const companyRole = user.companies.find(c => c.companyId === companyId);
    if (!companyRole || companyRole.role !== 'owner') {
      throw new ForbiddenException('Owner role required');
    }
    return true;
  }
}
```

**Rationale:** Guards must validate role in the context of the company specified in X-Company-Id header, matching the JWT companies array

### 3. API Endpoints Design

| Endpoint | Method | Guard | Description |
|----------|--------|-------|-------------|
| `/companies/:id/invite` | POST | AdminGuard | Send invitation |
| `/companies/:id/invitations/:token/accept` | POST | None (token) | Accept invitation |
| `/companies/:id/transfer-ownership` | POST | OwnerGuard | Transfer ownership |
| `/companies/:id/users/:userId/role` | PATCH | AdminGuard | Update user role |
| `/companies/:id/users/:userId` | DELETE | AdminGuard | Remove user from company |
| `/companies/:id/delete` | DELETE | OwnerGuard (soft) | Soft delete company |
| `/companies/:id/hard-delete` | DELETE | SuperAdmin (hard) | Hard delete |

### 4. Invitation System Design
**Decision:** Use token-based invitations with expiry

```typescript
// Invitation entity
@Entity('company_invitations')
export class CompanyInvitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'companyId' })
  companyId!: string;

  @Column({ type: 'uuid', name: 'invitedByUserId' })
  invitedByUserId!: string;

  @Column()
  email!: string;

  @Column()
  token!: string; // Secure random token

  @Column({ type: 'timestamp', name: 'expiresAt' })
  expiresAt!: Date;

  @Column({ default: false })
  used!: boolean;
}
```

**Rationale:** Token-based invitations are more secure than magic links and support email delivery

### 5. Ownership Transfer Flow
**Decision:** Two-step transfer with automatic role demotion

1. Owner calls POST `/companies/:id/transfer-ownership` with target user email
2. System validates current user is Owner
3. System validates target user exists and is member/admin of company
4. System updates: new Owner = target user, old Owner = Admin

**Rationale:** This ensures there's always exactly one Owner and provides clear audit trail

### 6. JWT Role Updates
**Decision:** Roles in JWT companies array remain strings ('owner', 'admin', 'member')

**Rationale:** 
- JWT already has role field in companies array
- Keeping as strings avoids enum serialization issues
- Roles are case-sensitive for consistency with existing tokens

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Race condition in ownership transfer** | Two owners temporarily | Use database transaction with locking |
| **Invitation token exposure** | Unauthorized access | Use crypto-random tokens, short expiry (24h) |
| **Orphaned companies (no owner)** | No way to transfer ownership | Prevent last owner deletion, require confirmation |

## Migration

**No migration needed** - development phase with no production data.

Simply:
1. Update the TypeScript enum to add OWNER
2. Drop/recreate user_companies table if needed
3. Deploy

## Risks / Trade-offs
