# Soft Delete Behavior - Developer Guide

## Overview
This document describes how soft delete is implemented in the NestJS SaaS backend and how to work with it.

---

## How Soft Delete Works

### Database Level
- All entities extend `BaseEntity` which includes a `deletedAt` column
- The column is a nullable timestamp: `deleted_at TIMESTAMP`
- When a record is "deleted", TypeORM sets `deleted_at` to the current timestamp
- Records with a non-null `deletedAt` are considered deleted

### Automatic Filtering
- TypeORM's soft delete is enabled on all entities
- Standard queries automatically filter out deleted records
- Uses `WHERE deleted_at IS NULL` clause automatically

---

## Entity Configuration

### Base Entity
```typescript
// src/common/entities/base.entity.ts
@Entity()
export class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

### Soft Delete Decorator
- `@DeleteDateColumn()` - TypeORM decorator for soft delete
- Automatically manages `deletedAt` column
- Works with TypeORM's `softDelete()` and `restore()` methods

---

## Repository Methods

### Standard Soft Delete
```typescript
// Soft delete - sets deletedAt timestamp
await userRepository.softDelete(userId);

// Hard delete - permanently removes record
await userRepository.hardDelete(userId);

// Restore - sets deletedAt to null
await userRepository.restore(userId);
```

### Querying with Deleted Records
```typescript
// Find including deleted
await userRepository.findByIdWithDeleted(userId);

// Find all including deleted
await userRepository.findAllWithDeleted();

// Find only deleted records
await userRepository.findOnlyDeleted();
```

---

## API Endpoints

### Soft Delete (DELETE)
```bash
DELETE /api/v1/users/{id}
DELETE /api/v1/companies/{id}
DELETE /api/v1/invitations/{id}
```
- Returns `204 No Content`
- Sets `deletedAt` timestamp, does not remove record

### Restore (POST)
```bash
POST /api/v1/users/{id}/restore
POST /api/v1/companies/{id}/restore
POST /api/v1/invitations/{id}/restore
```
- Returns `201 Created`
- Sets `deletedAt` to null

### Query with Deleted
```bash
GET /api/v1/users?includeDeleted=true
GET /api/v1/companies?includeDeleted=true
```
- Returns all records including soft-deleted

---

## Behavior Examples

### Example 1: Soft Delete a User
```typescript
// Before delete
const user = await userRepository.findById(userId);
console.log(user.deletedAt); // null

// Soft delete
await userRepository.softDelete(userId);

// After delete
const deletedUser = await userRepository.findById(userId);
console.log(deletedUser); // null (filtered out by default)

const userWithDeleted = await userRepository.findByIdWithDeleted(userId);
console.log(userWithDeleted.deletedAt); // 2024-01-15T10:30:00.000Z
```

### Example 2: Restore a Company
```typescript
// Restore soft-deleted company
const restored = await companyRepository.restore(companyId);

// Verify
const company = await companyRepository.findById(companyId);
console.log(company.deletedAt); // null
```

### Example 3: List Only Deleted Records
```typescript
const deletedUsers = await userRepository.findOnlyDeleted();
console.log(deletedUsers);
// [
//   { id: '1', email: 'deleted@test.com', deletedAt: Date },
//   { id: '2', email: 'another@test.com', deletedAt: Date }
// ]
```

---

## Middleware Behavior

### TypeORM Subscriber
The soft delete subscriber automatically:
1. Adds `deletedAt IS NULL` to WHERE clauses
2. Excludes deleted records from results
3. Respects `withDeleted()` when explicitly requested

### Automatic Query Filtering
```typescript
// This automatically excludes deleted records
const users = await userRepository.findAll();

// To include deleted, use withDeleted option
const allUsers = await userRepository.find({ withDeleted: true });
```

---

## Considerations for Developers

### Cascading Soft Deletes
- Related entities may need manual soft delete handling
- Check entity relationships for cascade configurations

### Performance
- An index is created on `deletedAt` for query performance
- Large tables with many deleted records may need periodic cleanup

### Data Recovery
- Soft-deleted records can always be restored
- Use `includeDeleted=true` for admin views
- Implement permanent hard delete carefully

### Testing
- Unit tests verify soft delete methods
- E2E tests verify API behavior
- Test restore functionality thoroughly

---

## Best Practices

1. **Always use soft delete** - Never use hard delete unless explicitly required
2. **Use repository methods** - Don't manually set `deletedAt`
3. **Admin access** - Use `withDeleted` for admin-only views
4. **Testing** - Include soft delete tests in test suite
5. **Monitoring** - Track deleted records for cleanup

---

## Error Handling

### Common Errors
- **Record not found**: Check if record was soft-deleted
- **Restore failed**: Record may not exist or already restored
- **Query returns null**: Record may be soft-deleted, try `withDeleted`

---

## Related Files

- `src/common/entities/base.entity.ts` - Base entity with soft delete
- `src/common/subscribers/soft-delete.subscriber.ts` - TypeORM subscriber
- `src/users/repositories/user.repository.ts` - User repository with soft delete methods
- `src/companies/repositories/company.repository.ts` - Company repository
