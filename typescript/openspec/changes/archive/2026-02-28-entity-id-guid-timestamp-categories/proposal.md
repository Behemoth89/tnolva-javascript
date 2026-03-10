# Proposal: Entity ID, GUID, Timestamp & Categories Enhancement

## Why

The current task management system uses a simple timestamp-based ID generation (`Date.now()-random`) which is not truly unique and lacks proper UUID standards. Additionally, there's no built-in support for timestamps (createdAt, updatedAt) on entities, making it impossible to track when tasks were created or modified. There's also no way to categorize tasks beyond simple tags. This change addresses these gaps by introducing a proper ID system, timestamp tracking, and a dedicated category entity with relationships.

## What Changes

### New Capabilities
- **IEntityId interface**: Extract the `id` property into a reusable interface that all entities can implement
- **GUID utility**: Create a proper UUID v4 generation utility to replace the current timestamp-based ID generation
- **IBaseEntity interface**: Add a base interface with `createdAt` and `updatedAt` timestamp fields that all entities can extend
- **Task Category entity**: Create a dedicated `ITaskCategory` interface and `TaskCategory` domain entity for organizing tasks into custom categories
- **Category repository**: Implement `ICategoryRepository` and `CategoryRepository` for CRUD operations on categories
- **Timestamp automation**: Update `BaseRepository` to automatically set `createdAt` on creation and `updatedAt` on modification

### Modified Capabilities
- **ITask interface**: Update to extend `IBaseEntity` and include optional `categoryId` for relationship
- **Task entity**: Implement timestamp fields and category relationship support
- **BaseRepository**: Use GUID utility for ID generation instead of timestamp-based approach
- **TaskRepository**: Handle category relationships when creating/querying tasks
- **UnitOfWork**: Include CategoryRepository for transactional operations
- **DTOs**: Add timestamp fields to create and update DTOs

### Breaking Changes
- **Task ID format**: Existing tasks will have different ID format (UUID vs timestamp-random). Migration strategy needed.
- **ITask interface**: Adding required `createdAt` and `updatedAt` fields to existing interface
- **Task-Category relationship**: Changed from optional categoryId to many-to-many via junction table

## Capabilities

### New Capabilities
- `entity-id-interface`: Extract id property into reusable IEntityId interface
- `guid-generation`: UUID v4 utility for consistent ID generation
- `base-entity-timestamps`: IBaseEntity with createdAt/updatedAt timestamps
- `task-category`: Custom task categorization with dedicated entity
- `category-assignment`: Many-to-many relationship via junction table
- `category-repository`: Repository implementation for category CRUD
- `repository-timestamp-handling`: Auto timestamp management in BaseRepository

### Modified Capabilities
- (none - this is a new feature set)

## Impact

### Affected Code
- **src/interfaces/**: New IEntityId.ts, IBaseEntity.ts, ITaskCategory.ts, ICategoryRepository.ts
- **src/domain/**: New TaskCategory.ts
- **src/utils/**: New guid.ts
- **src/data/repositories/**: Modified BaseRepository.ts, new CategoryRepository.ts
- **src/data/unit-of-work/**: Modified UnitOfWork.ts

### APIs
- New CategoryRepository API
- Modified TaskRepository API with category support

### Dependencies
- No new external dependencies (using native crypto for UUID)

### Migration
- Existing tasks need migration to add timestamps (can be done lazily)
- ID format change requires consideration for data migration
