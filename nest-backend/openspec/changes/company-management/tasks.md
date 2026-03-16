## 1. Database Migration for Company Table

- [ ] 1.1 Create TypeORM migration to add `companies` table with columns: id (UUID), name (varchar), slug (varchar unique), settings (jsonb), isActive (boolean), created_at, updated_at, deleted_at
- [ ] 1.2 Add unique index on slug column
- [ ] 1.3 Add index on deleted_at for query performance
- [ ] 1.4 Verify migration runs successfully on database

## 2. Company Entity Implementation

- [ ] 2.1 Create `src/companies/entities/company.entity.ts` extending BaseEntity
- [ ] 2.2 Add name, slug, settings, isActive columns
- [ ] 2.3 Add unique index on slug at entity level
- [ ] 2.4 Verify entity compiles and TypeORM recognizes it

## 3. Company Repository

- [ ] 3.1 Create `src/companies/repositories/company.repository.ts`
- [ ] 3.2 Implement findAll, findOne, create, update, softDelete, restore methods
- [ ] 3.3 Add findBySlug method for duplicate checking
- [ ] 3.4 Add findActive method for public listing

## 4. Company Service

- [ ] 4.1 Create `src/companies/services/companies.service.ts`
- [ ] 4.2 Inject CompanyRepository and TenantService
- [ ] 4.3 Implement CRUD methods with tenant filtering
- [ ] 4.4 Add slug auto-generation utility (name → kebab-case, handle duplicates)
- [ ] 4.4 Add company creation from registration flow integration point

## 5. Company DTOs

- [ ] 5.1 Create `src/companies/dto/create-company.dto.ts` with name (required), optional slug, optional settings
- [ ] 5.2 Create `src/companies/dto/update-company.dto.ts` with partial fields
- [ ] 5.3 Add class-validator decorators for validation
- [ ] 5.4 Add swagger decorators for API documentation

## 6. Company Controller

- [ ] 6.1 Create `src/companies/controllers/companies.controller.ts`
- [ ] 6.2 Implement GET /companies (authenticated, returns user's companies only)
- [ ] 6.3 Implement POST /companies (authenticated, admin only)
- [ ] 6.4 Implement GET /companies/:id (authenticated, access check)
- [ ] 6.5 Implement PUT /companies/:id (authenticated, admin only)
- [ ] 6.6 Implement DELETE /companies/:id (soft delete, admin only)
- [ ] 6.7 Implement POST /companies/:id/restore (admin only)

## 7. Companies Module

- [ ] 7.1 Create `src/companies/companies.module.ts`
- [ ] 7.2 Import UserModule and UserCompanyRepository
- [ ] 7.3 Register CompanyRepository and CompaniesService
- [ ] 7.4 Import into AppModule

## 8. User Registration Integration

- [ ] 8.1 Update `src/auth/dto/register.dto.ts` to accept optional companyName
- [ ] 8.2 Update `src/auth/services/auth.service.ts` to create company if companyName provided
- [ ] 8.3 Associate registering user as admin of new company
- [ ] 8.4 Update login response to include new company

## 9. API Documentation

- [ ] 9.1 Add companies tags to Swagger
- [ ] 9.2 Document all endpoints with descriptions
- [ ] 9.3 Add examples for request/response bodies
- [ ] 9.4 Verify docs render at /api/docs/v1

## 10. Testing

- [ ] 10.1 Write unit tests for CompaniesService CRUD methods
- [ ] 10.2 Write unit tests for CompanyRepository methods
- [ ] 10.3 Write e2e tests for company CRUD endpoints
- [ ] 10.4 Write e2e tests for registration with company creation
- [ ] 10.5 Write e2e tests for company access validation
