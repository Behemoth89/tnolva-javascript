## Context

The system has multi-tenant infrastructure in place (user_companies junction table, JWT with companies array, TenantGuard, company context middleware) but lacks an actual Company entity. Currently:
- `user_companies` table exists with userId, companyId, role - but companyId is a UUID with no referential integrity to an actual companies table
- Users can be associated with multiple companies via JWT
- Company context is handled via X-Company-Id header

Companies cannot be created, listed, updated, or deleted through the API.

## Goals / Non-Goals

**Goals:**
- Create Company entity with CRUD operations
- Integrate with existing user_companies table
- Support soft delete for companies
- Provide list endpoint for company selection UI
- Add optional company creation during user registration

**Non-Goals:**
- Company subscription/billing management (future capability)
- Company logo/file upload (future capability)
- Company invitation system (separate change)
- Multi-company admin portal (future)

## Decisions

### Decision 1: Company entity fields

**Choice**: Company entity has: name, slug (required, auto-generated from name), settings (JSON), isActive

**Rationale**:
- name: Required for display
- slug: Required URL-friendly identifier, auto-generated from name if not provided (e.g., "Acme Corp" → "acme-corp")
- settings: JSON blob for flexible per-company configuration (timezone, locale, etc.)
- isActive: Allow disabling companies without deletion
- Slug is required to enable shareable links and API-friendly URLs

### Decision 2: Self-referential vs top-level only

**Choice**: Companies are top-level only (no nested/hierarchical companies)

**Rationale**:
- Simpler model for MVP
- Can add hierarchy later if needed

**Alternative Considered**: Parent-company/child-company relationships
- Rejected: Keep it simple for now

### Decision 3: Company list endpoint

**Choice**: GET /companies requires authentication - returns companies the user has access to

**Rationale**:
- Users select company after logging in
- No sensitive data exposed to unauthenticated users
- Aligns with existing multi-company flow via X-Company-Id header

**Alternative Considered**: Public endpoint returning active companies
- Rejected per user feedback: No public company list

### Decision 4: Registration flow integration

**Choice**: Registration accepts optional `companyName` - if provided, creates company and associates user as admin

**Rationale**:
- Enables self-serve onboarding
- Main user becomes admin of their company

**Alternative Considered**: Separate "create company" step after registration
- Rejected: More friction, self-serve is better

## Risks / Trade-offs

- **Risk**: Company slug uniqueness not enforced → Mitigation: Add unique index on slug
- **Risk**: Deleting company orphans user_companies → Mitigation: Soft delete only, never hard delete companies with active users
- **Risk**: Large companies array in JWT → Mitigation: Limit max companies per user (50), paginate if needed

## Migration Plan

1. Create TypeORM migration for companies table
2. Create Company entity extending BaseEntity
3. Create CompanyRepository with soft delete CRUD
4. Create CompaniesModule, CompaniesService, CompaniesController
5. Add DTOs: CreateCompanyDto, UpdateCompanyDto
6. Add endpoints with proper guards
7. Update user registration to optionally create company
8. Update Swagger docs

## Open Questions

1. **Q**: Should companies be scoped to a single super-admin user?
   - **A**: No - allow multiple admins per company (user_companies role = 'admin')

2. **Q**: What happens when company is soft deleted?
   - **A**: Users can no longer access it; user_companies remains but company not returned in list

3. **Q**: Rate limiting on company list endpoint?
   - **A**: Apply standard throttling - public but not paginated heavily
