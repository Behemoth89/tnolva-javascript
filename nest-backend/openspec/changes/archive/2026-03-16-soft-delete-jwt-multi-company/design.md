## Context

The current NestJS SaaS backend implements basic multi-tenant isolation using `companyId` on all entities, but lacks two critical features:

1. **Soft Delete**: Currently, all deletions are permanent (hard deletes). This prevents data recovery, audit trails, and compliance with data retention policies.

2. **Multi-Company JWT**: The JWT token structure only supports a single `companyId`, meaning users belonging to multiple companies must re-authenticate to switch between them.

### Current Architecture
- Entities extend `BaseEntity` with `id` (UUID), `companyId`, `createdAt`, `updatedAt`
- JWT payload: `{ sub: userId, email, companyId }`
- TenantGuard enforces `companyId` presence on protected routes
- All repositories use TypeORM with direct queries

### Constraints
- Must maintain backward compatibility with existing API contracts
- Cannot break existing tenant isolation (companyId-based)
- Token refresh should not require re-login when company list updates

## Goals / Non-Goals

**Goals:**
- Implement soft delete on all entities with automatic query filtering
- Support multi-company JWT tokens with role information per company
- Create company context middleware for request-scoped company validation
- Enable admin/audit access to soft-deleted records

**Non-Goals:**
- Implementing full user-company-role management (separate capability)
- Multi-database tenant isolation (current single-db multi-tenant is sufficient)
- Real-time company switch notifications (polling/refresh acceptable)
- Soft delete for audit logs that require permanent retention

## Decisions

### Decision 1: Soft Delete Strategy - deletedAt Timestamp over isDeleted Flag

**Choice**: Use `deletedAt: timestamp | null` field instead of boolean `isDeleted`

**Rationale**:
- Provides exact deletion timestamp for audit/compliance
- Automatically indicates whether record is deleted (null = active, set = deleted)
- Compatible with TypeORM's built-in `SoftDelete` mixin
- Can query for "deleted before X date" scenarios

**Alternative Considered**: Boolean `isDeleted` flag
- Rejected because it loses temporal information and requires additional queries

### Decision 2: Query Scope Implementation - TypeORM Subscriber vs. Repository Hooks

**Choice**: Use TypeORM `QuerySoftSoftDelete` subscriber pattern

**Rationale**:
- Automatically applies to ALL queries without modifying each repository
- Consistent behavior across the entire application
- Can be bypassed explicitly when needed (admin/audit queries)

**Alternative Considered**: Manual `withDeleted()` calls per repository
- Rejected due to high chance of inconsistency and missed cases

### Decision 3: JWT Companies Array Structure

**Choice**: JWT payload includes `companies: Array<{ companyId: string, role: string }>`

**Rationale**:
- Flat structure easy to validate and parse
- Role per company enables different permission levels
- Can be extended with additional fields (permissions[], department, etc.)

**Alternative Considered**: Nested `companyRoles: { [companyId]: string[] }`
- Rejected as less flexible for future extensions

### Decision 4: Company Context Selection

**Choice**: Client sends `X-Company-Id` header for operations, validated against token's companies array

**Rationale**:
- Standard header pattern for tenant-scoped APIs
- Allows switching companies without token refresh
- Server validates user has access to requested company

**Alternative Considered**: Re-authenticate with companyId in payload
- Rejected as poor UX for multi-company users

### Decision 5: Token Refresh Strategy

**Choice**: Short-lived access tokens (15 min) + refresh endpoint that returns new access token with updated companies

**Rationale**:
- Security best practice (limited token lifetime)
- Refresh endpoint can validate company list changes
- Existing token invalidation possible on company removal

**Alternative Considered**: Long-lived tokens with periodic company validation
- Rejected as it defeats purpose of token expiration

## Risks / Trade-offs

### Risk 1: Backward Compatibility
**Risk**: Adding soft delete may break existing DELETE endpoints that expect 204 No Content
**Mitigation**: Ensure DELETE operations return 204 as before; soft delete happens silently at DB layer

### Risk 2: Performance Impact
**Risk**: Soft delete queries with `deletedAt IS NULL` filter on large tables
**Mitigation**: Add database index on `deletedAt` column; query optimization for common use cases

### Risk 3: Token Size
**Risk**: Companies array may grow large for users with many company associations
**Mitigation**: Limit max companies per user (configurable, default 50); paginate if needed

### Risk 4: Cascade Delete Behavior
**Risk**: Relationships with `cascade: true` may not respect soft delete
**Mitigation**: Review all entity relationships; use `@JoinColumn({ nullable: true })` patterns

### Risk 5: Race Condition on Company Switch
**Risk**: User switches company while in-progress request
**Mitigation**: Company context captured at request start; cannot change mid-request

## Migration Plan

### Phase 1: Database Migration
1. Add `deleted_at` column (timestamp, nullable) to all tables
2. Add index on `deleted_at` for query performance
3. No data migration needed (null for existing records)

### Phase 2: Core Implementation
1. Update BaseEntity with soft delete fields
2. Create TypeORM subscriber for automatic filtering
3. Update repositories to support hard delete/restore

### Phase 3: JWT Enhancement
1. Update JwtStrategy and JwtPayload interface
2. Modify AuthService to generate companies array
3. Add company-context middleware

### Phase 4: API Updates
1. Create company-switch endpoint
2. Update login response to include companies
3. Add withDeleted query parameter for admin endpoints

### Rollback Strategy
- Database migration is forward-only; rollback requires restore from backup
- Code changes can be reverted; soft delete columns are harmless if unused
- JWT changes are backward compatible (existing single-company tokens still work)

## Open Questions

1. **Q**: Should soft delete be opt-in per entity or automatic for all?
   - **A**: Automatic for all entities extending BaseEntity (simpler, consistent)

2. **Q**: How to handle company associations - separate table or denormalized?
   - **A**: Separate `user_companies` table with userId, companyId, role (normalized, supports future attributes)

3. **Q**: What happens to data when company is deleted?
   - **A**: Soft delete the company; all its data becomes inaccessible but recoverable

4. **Q**: Rate limiting per company or per user?
   - **A**: Per user (existing); company context is for isolation, not rate limiting
