# Migration Guide - Soft Delete & Multi-Company JWT

## Overview
This guide helps existing installations migrate to the new soft delete and multi-company JWT features.

---

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Existing NestJS SaaS backend installation

---

## Pre-Migration Checklist

- [ ] Backup database
- [ ] Review breaking changes
- [ ] Update environment variables
- [ ] Test in staging environment

---

## Migration Steps

### Step 1: Database Migration

Run the following commands to add soft delete columns:

```bash
# Generate migration for soft delete columns
npm run migration:generate -- AddSoftDeleteColumns

# Run migration
npm run migration:run
```

This will create:
- `deleted_at` column on all tables
- Indexes on `deleted_at` for query performance
- `user_companies` junction table

### Step 2: Environment Variables

Ensure `JWT_SECRET` is set in your environment:

```bash
# .env file
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=15m
```

### Step 3: Code Updates

If you're using a custom JWT strategy, update it to handle the `companies` array:

```typescript
// Before
validate(payload: any) {
  return { userId: payload.sub, email: payload.email };
}

// After
validate(payload: any) {
  return {
    userId: payload.sub,
    email: payload.email,
    companyId: payload.companyId,
    companies: payload.companies || [],
  };
}
```

### Step 4: Update API Calls

#### Login Response Changes
**Before:**
```json
{
  "user": { "id": "uuid", "email": "user@test.com" },
  "accessToken": "..."
}
```

**After:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@test.com",
    "companies": [{ "companyId": "uuid", "role": "admin" }]
  },
  "accessToken": "..."
}
```

#### Multi-Company Header
For users with multiple companies, add `X-Company-Id` header:

```bash
curl -X GET /api/v1/companies \
  -H "Authorization: Bearer token" \
  -H "X-Company-Id: company-uuid"
```

---

## Breaking Changes

### 1. DELETE Endpoints
- **Before**: Permanently removed records
- **After**: Soft deletes (sets `deletedAt` timestamp)
- **Impact**: Old integrations may expect permanent deletion

### 2. Query Results
- **Before**: All records
- **After**: Only non-deleted records by default
- **Mitigation**: Use `?includeDeleted=true` for deleted records

### 3. JWT Token
- **Before**: Single `companyId`
- **After**: `companies` array + `companyId`
- **Impact**: Token size slightly increased

---

## Rollback Plan

If issues occur:

1. **Database Rollback**:
   ```bash
   npm run migration:revert
   ```

2. **Code Rollback**:
   - Revert to previous version
   - Redeploy

3. **Data Recovery**:
   - Soft-deleted data remains in database
   - Can be restored manually if needed

---

## Post-Migration Verification

### 1. Test Login
```bash
curl -X POST /api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "password"}'
```

Verify response includes `companies` array.

### 2. Test Soft Delete
```bash
# Delete a record
curl -X DELETE /api/v1/companies/{id} \
  -H "Authorization: Bearer token"

# Verify it's soft deleted
curl -X GET /api/v1/companies/{id} \
  -H "Authorization: Bearer token"
# Should return 404

# Query with deleted
curl -X GET "/api/v1/companies?includeDeleted=true" \
  -H "Authorization: Bearer token"
# Should include the deleted record
```

### 3. Test Restore
```bash
# Restore the record
curl -X POST /api/v1/companies/{id}/restore \
  -H "Authorization: Bearer token"

# Verify restored
curl -X GET /api/v1/companies/{id} \
  -H "Authorization: Bearer token"
# Should return 200
```

### 4. Run Tests
```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e
```

---

## Common Issues

### Issue: Deleted records still visible
**Solution**: Check that migration ran successfully and `deleted_at` column exists.

### Issue: Multi-company login fails
**Solution**: Ensure `X-Company-Id` header is provided for users with multiple companies.

### Issue: Token validation fails
**Solution**: Verify JWT_SECRET is set and matches across instances.

### Issue: Company switch returns 403
**Solution**: Verify user belongs to the company in the `user_companies` table.

---

## Data Cleanup (Optional)

After migration, you may want to permanently remove old soft-deleted records:

```typescript
// In a migration or script
await userRepository
  .createQueryBuilder()
  .delete()
  .where('deletedAt < :date', { date: oneYearAgo })
  .execute();
```

**Warning**: This is irreversible. Backup first.

---

## Support

For issues:
1. Check logs in `logs/` directory
2. Review migration status: `npm run migration:show`
3. Verify database schema matches expected structure

---

## Version Information

- **Migration Date**: 2024-01-15
- **Database Version**: 1.0.0
- **API Version**: v1
