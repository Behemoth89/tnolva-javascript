## 1. Database Migration for Soft Delete

- [ ] 1.1 Create TypeORM migration to add `deleted_at` timestamp column to all tables
- [ ] 1.2 Add index on `deleted_at` column for query performance
- [ ] 1.3 Verify migration runs successfully on database

## 2. Base Entity Soft Delete Implementation

- [ ] 2.1 Update `src/common/entities/base.entity.ts` with `deletedAt` column using `@DeleteDateColumn`
- [ ] 2.2 Configure soft delete with TypeORM's `SoftDelete` enable
- [ ] 2.3 Verify all entities inherit soft delete functionality

## 3. TypeORM Soft Delete Subscriber

- [ ] 3.1 Create `src/common/subscribers/soft-delete.subscriber.ts` 
- [ ] 3.2 Implement `afterQuery` hook to automatically filter deleted records
- [ ] 3.3 Register subscriber in `src/app.module.ts`
- [ ] 3.4 Add `withDeleted()` method support for admin queries

## 4. Repository Soft Delete Methods

- [ ] 4.1 Update `src/users/repositories/user.repository.ts` with soft delete methods
- [ ] 4.2 Create base repository class with soft delete, hard delete, restore methods
- [ ] 4.3 Update all existing repositories to inherit from base
- [ ] 4.4 Add `findWithDeleted()` and `findOnlyDeleted()` methods

## 5. User Authentication - JWT Multi-Company

- [ ] 5.1 Update `src/auth/strategies/jwt.strategy.ts` to handle companies array in payload
- [ ] 5.2 Update `JwtPayload` interface to include `companies: Array<{ companyId: string, role: string }>`
- [ ] 5.3 Modify `src/auth/services/auth.service.ts` to generate tokens with companies array
- [ ] 5.4 Create user companies service to manage user-company associations

## 6. User Companies Table

- [ ] 6.1 Create migration for `user_companies` junction table
- [ ] 6.2 Create `src/users/entities/user-company.entity.ts` entity
- [ ] 6.3 Create `src/users/repositories/user-company.repository.ts` repository
- [ ] 6.4 Add methods for adding/removing/listing user company associations

## 7. Token Refresh Implementation

- [ ] 7.1 Create `src/auth/dto/refresh-token.dto.ts`
- [ ] 7.2 Add refresh token endpoint in `src/auth/controllers/auth.controller.ts`
- [ ] 7.3 Implement refresh logic that updates companies list
- [ ] 7.4 Handle company removal in refresh logic

## 8. Login Response Enhancement

- [ ] 8.1 Update login response to include `companies` array
- [ ] 8.2 Update register response similarly
- [ ] 8.3 Add company selection to initial login (optional companyId parameter)

## 9. Company Context Middleware

- [ ] 9.1 Create `src/common/middleware/company-context.middleware.ts`
- [ ] 9.2 Extract `X-Company-Id` header from requests
- [ ] 9.3 Validate company is in user's companies list
- [ ] 9.4 Set company context in TenantService

## 10. Company Context Guard Enhancement

- [ ] 10.1 Update `src/common/guards/tenant.guard.ts` to validate company access
- [ ] 10.2 Check if requested companyId is in user's companies array
- [ ] 10.3 Return 403 if user doesn't have access to company
- [ ] 10.4 Handle single-company users (auto-select company)

## 11. CurrentCompany Decorator

- [ ] 11.1 Create `src/auth/decorators/current-company.decorator.ts`
- [ ] 11.2 Extract companyId from request context
- [ ] 11.3 Return companyId string for use in controllers/services

## 12. API Endpoint Updates

- [ ] 12.1 Add company switching endpoint `POST /auth/switch-company`
- [ ] 12.2 Add `includeDeleted` query parameter to list endpoints
- [ ] 12.3 Add admin endpoints for soft delete management
- [ ] 12.4 Update Swagger documentation for new endpoints

## 13. Testing

- [ ] 13.1 Write unit tests for soft delete repository methods
- [ ] 13.2 Write unit tests for JWT companies array generation
- [ ] 13.3 Write unit tests for company context middleware
- [ ] 13.4 Write e2e tests for multi-company login flow
- [ ] 13.5 Write e2e tests for company switching
- [ ] 13.6 Write e2e tests for soft delete queries

## 14. Documentation

- [ ] 14.1 Update API documentation for new endpoints
- [ ] 14.2 Document JWT token structure changes
- [ ] 14.3 Document soft delete behavior for developers
- [ ] 14.4 Create migration guide for existing installations
