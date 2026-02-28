/opsx-new.md plan a typical task management utility domains, interfaces, relationships. Task properties at least: id, title, description, status, priority, dueDate, tags[].

***

/opsx-apply.md task-management-utility

***

/opsx-archive.md task-management-utility

***

/opsx-new.md design DAL layer. use repository pattern with uow. use existing domain interfaces. use localstorage. plan full crud with search and filter and use async

***

Update specs to add explicit migration path documentation

***

## Code Review: DAL Layer Implementation (design-dal-layer)

### Summary

This change implements a Data Access Layer (DAL) with Repository pattern, Unit of Work, Query Builder, and LocalStorage adapter. The architecture is well-designed, but there are **9 failing tests** with critical bugs in both implementation and tests.

---

### Issues Found

| Severity | File:Line | Issue |
|----------|-----------|-------|
| CRITICAL | `src/data/repositories/BaseRepository.ts:97` | ID generation overwrites user-provided IDs |
| CRITICAL | `src/tests/TaskRepository.test.ts:69` | Tests use wrong IDs after task creation |
| CRITICAL | `src/data/unit-of-work/UnitOfWork.ts:104` | Commit after rollback doesn't throw (logic bug) |
| WARNING | `src/interfaces/IUnitOfWork.ts:9` | Uses `unknown` instead of typed return |
| WARNING | `src/tests/LocalStorageAdapter.test.ts:89` | Test has incorrect string expectation |

---

### Detailed Findings

#### 1. Task ID Overwrite (CRITICAL)
**File:** [`BaseRepository.ts:97`](src/data/repositories/BaseRepository.ts:97)  
**Confidence:** 95%  
The `createAsync` always generates a new ID via `generateId()`, overwriting any existing ID. This causes tests to fail because they create tasks with specific IDs but then search for those original IDs after they've been replaced with generated ones.

**Fix:**
```typescript
const existingId = this.getEntityId(entity);
const id = existingId || this.generateId();
this.setEntityId(entity, id);
```

#### 2. Test Uses Wrong ID After Creation (CRITICAL)
**File:** [`TaskRepository.test.ts:69`](src/tests/TaskRepository.test.ts:69)  
**Confidence:** 95%  
Test creates a task with `id: 'task-1'`, calls `createAsync()` (which generates a NEW ID), then tries to find using the OLD ID.

**Fix:**
```typescript
const created = await repository.createAsync(task);
const found = await repository.getByIdAsync(created.id);
```

#### 3. UnitOfWork Commit After Rollback Bug (CRITICAL)
**File:** [`UnitOfWork.ts:104`](src/data/unit-of-work/UnitOfWork.ts:104)  
**Confidence:** 90%  
After `rollback()`, setting `committed = false` allows subsequent commits, contradicting rollback semantics.

**Fix:** Remove the `this.committed = false` line in `rollback()`.

#### 4. IUnitOfWork Uses Unknown Type (WARNING)
**File:** [`IUnitOfWork.ts:9`](src/interfaces/IUnitOfWork.ts:9)  
Return type should be `ITaskRepository`, not `unknown`.

#### 5. LocalStorageAdapter Test Incorrect Expectation (WARNING)
**File:** [`LocalStorageAdapter.test.ts:89`](src/tests/LocalStorageAdapter.test.ts:89)  
Test expects `'value1'` to be stored as `'\"value1\"'`, but strings are stored directly (line 54 handles this correctly).

---

### Recommendation

**NEEDS CHANGES** - Fix the critical bugs:
1. Don't overwrite existing IDs in `BaseRepository.createAsync()`
2. Fix UnitOfWork to prevent commit after rollback
3. Update tests to use returned IDs from create operations
4. Fix incorrect test expectations

The implementation shows solid understanding of Repository and Unit of Work patterns. Once these issues are addressed, the code will be production-ready.

***

## Code Review: DAL Layer Implementation

### Summary
This change implements a comprehensive Data Access Layer (DAL) for the task management application, including the Repository pattern, Unit of Work pattern, Query Builder, and Storage Adapters. The implementation adds new interfaces (`IRepository`, `ITaskRepository`, `IUnitOfWork`, `IUnitOfWorkFactory`), concrete implementations, and comprehensive unit tests (76 tests, all passing). The vitest environment was changed from `node` to `jsdom` to support browser storage APIs.

---

### Issues Found
| Severity | File:Line | Issue |
|----------|-----------|-------|
| WARNING | [`src/data/query/IQueryBuilder.ts:28`](src/data/query/IQueryBuilder.ts:28) | `where()` and `orWhere()` accept `operator: string` instead of `FilterOperator` type |
| WARNING | [`src/tests/TaskRepository.test.ts:31`](src/tests/TaskRepository.test.ts:31) | Tests use `as any` type casting extensively |
| SUGGESTION | [`src/data/repositories/BaseRepository.ts:72`](src/data/repositories/BaseRepository.ts:72) | `query()` uses sync `getAll()` instead of async `getAllAsync()` |
| SUGGESTION | [`src/data/unit-of-work/UnitOfWork.ts:18`](src/data/unit-of-work/UnitOfWork.ts:18) | UnitOfWork is tightly coupled to TaskRepository only |

---

### Detailed Findings

#### 1. Type Safety Issue in IQueryBuilder
- **File:** [`src/data/query/IQueryBuilder.ts:28`](src/data/query/IQueryBuilder.ts:28)
- **Confidence:** 90%
- **Problem:** The `where()` and `orWhere()` method signatures accept `operator: string` instead of the defined `FilterOperator` type. This defeats the purpose of having a typed union and allows invalid operators at compile time.
- **Suggestion:** Change the interface to use the proper type:
```typescript
where(field: string, operator: FilterOperator, value: unknown): IQueryBuilder<T>;
orWhere(field: string, operator: FilterOperator, value: unknown): IQueryBuilder<T>;
```
Note: The implementation in [`QueryBuilder.ts:28`](src/data/query/QueryBuilder.ts:28) correctly uses `FilterOperator`, so this is purely an interface definition issue.

---

#### 2. Type Casting in Tests
- **File:** [`src/tests/TaskRepository.test.ts:31`](src/tests/TaskRepository.test.ts:31), [`src/tests/UnitOfWork.test.ts`](src/tests/UnitOfWork.test.ts)
- **Confidence:** 85%
- **Problem:** Tests use extensive `as any` type casting to work around type mismatches. This can hide type errors and reduce the value of TypeScript's type checking.
- **Suggestion:** Either fix the type definitions to match actual return types, or expose the correct typed methods in the interfaces.

---

#### 3. Sync Query in Async Repository
- **File:** [`src/data/repositories/BaseRepository.ts:72`](src/data/repositories/BaseRepository.ts:72)
- **Confidence:** 75%
- **Problem:** The `query()` method uses synchronous `getAll()` which loads all data into memory synchronously, even though the rest of the repository uses async operations. This is inconsistent and could cause performance issues.
- **Suggestion:** Consider adding an async version:
```typescript
queryAsync(): IQueryBuilder<T> {
  return new QueryBuilder(async () => await this.getAllAsync());
}
```

---

#### 4. Limited UnitOfWork Extensibility
- **File:** [`src/data/unit-of-work/UnitOfWork.ts:18`](src/data/unit-of-work/UnitOfWork.ts:18)
- **Confidence:** 75%
- **Problem:** `UnitOfWork` is hardcoded to only work with `TaskRepository`. Adding support for additional entity types would require modifying the class.
- **Suggestion:** This is acceptable for the current scope but should be documented or refactored if the application grows to include more entities.

---

### Recommendation
**APPROVE WITH SUGGESTIONS**

The implementation is solid and all 76 tests pass. The issues identified are minor and don't affect functionality. The type safety issue in `IQueryBuilder` is the most important to address for long-term maintainability, as it defeats the purpose of the `FilterOperator` type definition.

***

## Code Review: DAL Layer Implementation (Uncommitted Changes)

### Summary
This change implements a complete Data Access Layer (DAL) with Repository pattern, Unit of Work, and Query Builder for the task management application. It includes new interfaces, implementations, and comprehensive tests. All 76 tests pass successfully.

### Issues Found

| Severity | File:Line | Issue |
|----------|-----------|-------|
| WARNING | [`UnitOfWork.ts:97`](src/data/unit-of-work/UnitOfWork.ts:97) | `rollback()` incorrectly sets `committed = true`, preventing UnitOfWork reuse |
| WARNING | [`UnitOfWork.ts:67-90`](src/data/unit-of-work/UnitOfWork.ts:67) | No error handling in `commit()` - partial commits possible on failure |
| SUGGESTION | [`UnitOfWork.test.ts`](src/tests/UnitOfWork.test.ts:31) | Tests use `as any` casts - interface/type mismatch |

### Detailed Findings

**1. UnitOfWork rollback bug (WARNING - 90% confidence)**
- **File:** [`src/data/unit-of-work/UnitOfWork.ts:97`](src/data/unit-of-work/UnitOfWork.ts:97)
- **Problem:** After calling `rollback()`, the code sets `this.committed = true`. This makes the UnitOfWork unusable for any subsequent operations, as `assertNotCommitted()` will throw.
- **Fix:** Change to `this.committed = false` to allow reuse after rollback.

**2. No error handling in commit (WARNING - 85% confidence)**
- **File:** [`src/data/unit-of-work/UnitOfWork.ts:67-90`](src/data/unit-of-work/UnitOfWork.ts:67)
- **Problem:** If an error occurs during `commit()` after some changes have been applied, there's no rollback mechanism, leaving storage in an inconsistent state.
- **Fix:** Wrap the commit loop in try-catch and call `rollback()` on error.

**3. Test type casting (SUGGESTION - 80% confidence)**
- **File:** [`src/tests/UnitOfWork.test.ts`](src/tests/UnitOfWork.test.ts)
- **Problem:** Tests use `as any` to call internal methods like `getAllAsync()`, `createAsync()`, etc.
- **Fix:** Either expose these methods in the public `ITaskRepository` interface, or use the public API consistently.

### Recommendation
**APPROVE WITH SUGGESTIONS** - The implementation is functional and all tests pass. However, the UnitOfWork rollback bug should be addressed before merging, as it can cause runtime errors when users attempt to reuse a UnitOfWork after rollback.

***

/opsx-new.md extend the interface system, make id separate interface and use utility to generate and use guid as id. i also need to timestamp tasks. make all current and future entitys use that. refactor repositorys to adapt timestamping. add custom task categories in separate entity and use relationships

***

can you add mermaid to visualise database structure that would be after this change?

***

use in between table, task may have many categories and category may have many tasks

***

always use guid as id, also in in between tables.

***

/opsx-apply.md entity-id-guid-timestamp-categories

***

make me mermaid about my interface hierarchy

***

why i need ITaskWithRelations

***

remove ITaskWithRelations. This is part of business logic and will be added later if neccesary

***

