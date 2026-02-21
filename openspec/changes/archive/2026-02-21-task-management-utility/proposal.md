## Why

A task management utility is needed to organize, track, and manage work items with proper domain modeling, interfaces, and relationships. This provides a solid foundation for building task-based applications with clear separation of concerns and type-safe interfaces.

## What Changes

- Create task domain with entities and value objects
- Define TypeScript interfaces for task operations following naming conventions (I prefix for interfaces, E prefix for enums)
- Model relationships between tasks and related entities (projects, users, tags)
- Implement task properties: id, title, description, status, priority, dueDate, tags[]
- Establish domain events and task lifecycle management

## Capabilities

### New Capabilities
- `task-domain`: Core task entity with all required properties (id, title, description, status, priority, dueDate, tags)
- `task-interface`: TypeScript interfaces for task operations and DTOs
- `task-relationships`: Relationships between tasks, projects, users, and tags
- `task-status-enum`: Status enumeration (EStatus: TODO, IN_PROGRESS, DONE, CANCELLED)
- `task-priority-enum`: Priority enumeration (EPriority: LOW, MEDIUM, HIGH, URGENT)

### Modified Capabilities
- None (new project)

## Impact

- New domain layer in `src/domain/`
- New interface definitions in `src/interfaces/`
- New enum definitions in `src/enums/`
- No breaking changes to existing code (new project)
