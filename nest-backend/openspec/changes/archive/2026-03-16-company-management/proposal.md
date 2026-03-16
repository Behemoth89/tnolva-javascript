## Why

The system has foundational multi-tenant infrastructure—user_companies junction table, JWT with companies array, tenant guards, and company context middleware—but lacks an actual Company entity. Companies cannot be created, updated, listed, or managed through the API. This blocks onboarding flows and prevents companies from being first-class entities in the system.

## What Changes

- Create `Company` entity extending `BaseEntity` with name, slug, settings
- Create TypeORM migration for `companies` table
- Create `CompanyRepository` with standard CRUD + soft delete support
- Create `CompaniesModule`, `CompaniesService`, `CompaniesController`
- Add company CRUD endpoints: `GET/POST /companies`, `GET/PUT/DELETE /companies/:id`
- Integrate with existing `user_companies` to link users to companies
- Add company creation to user registration flow (auto-create first company)
- Swagger documentation for all endpoints

## Capabilities

### New Capabilities
- `company-management`: Full CRUD for companies with multi-tenant isolation

### Modified Capabilities
- (none - this is a net-new capability)

## Impact

- New code: `src/companies/` module with entity, repository, service, controller, DTOs
- New database: `companies` table with foreign key from `user_companies`
- New endpoints: `/api/v1/companies` (authenticated CRUD - no public list)
- Modified: User registration should optionally create and associate a first company
