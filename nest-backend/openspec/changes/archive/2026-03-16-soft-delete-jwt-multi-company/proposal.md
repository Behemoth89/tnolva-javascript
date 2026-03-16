## Why

The current NestJS SaaS backend lacks soft delete functionality, meaning all deletions are permanent, which poses risks for data recovery and audit trails. Additionally, the JWT token structure only supports a single company per user, preventing users from accessing multiple companies without re-authentication. This change addresses both issues by implementing a comprehensive soft delete system and enhancing JWT tokens to support multi-company access.

## What Changes

### Soft Delete Implementation
- Modify BaseEntity to include soft delete fields (deletedAt timestamp and isDeleted flag)
- Implement TypeORM query scopes to automatically exclude soft-deleted records
- Update all CRUD operations to use soft delete instead of hard delete
- Add repository methods for hard delete and restore operations
- Ensure relationships and cascades respect soft delete behavior

### JWT Multi-Company Enhancement
- Redesign JWT token payload to include a companies array with companyId and role information
- Implement token refresh logic to handle company list updates without re-authentication
- Create middleware and decorators to extract company context from tokens
- Add company scope validation for user permissions
- Update authentication flow to support initial company selection

### Database & API Changes
- Add database migration for soft delete columns
- Create new API endpoints for company context management
- Implement company switching functionality
- Add admin/audit endpoints to include soft-deleted records

### Frontend Considerations
- Design company selection interface for multi-company users
- Store selected company context in state/local storage
- Handle token refresh with company list updates

## Capabilities

### New Capabilities
- `soft-delete`: Comprehensive soft delete functionality with automatic query filtering, hard delete, and restore capabilities
- `multi-company-jwt`: Enhanced JWT tokens supporting multiple company associations with role information
- `company-context`: Company scope extraction and permission validation middleware

### Modified Capabilities
- `user-auth`: The existing user-auth specification will be extended to include multi-company login flows and company context in authentication responses

## Impact

### Backend Code Changes
- `src/common/entities/base.entity.ts` - Add soft delete columns
- `src/auth/strategies/jwt.strategy.ts` - Update JWT payload interface
- `src/auth/services/auth.service.ts` - Implement multi-company token generation
- All repository files - Add soft delete query scopes
- `src/common/guards/tenant.guard.ts` - Enhance for company context validation
- New middleware files for company context extraction
- New decorators for company-scoped operations

### Database
- New migration for soft delete columns (deletedAt, isDeleted)
- Potential new tables for user-company-role associations

### API
- New endpoints for company switching and context management
- Modified login/register responses to include companies array

### Dependencies
- No new npm packages required
- Uses existing TypeORM and NestJS patterns
