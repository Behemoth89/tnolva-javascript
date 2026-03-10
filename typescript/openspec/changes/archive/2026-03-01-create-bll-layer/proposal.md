## Why

The current codebase lacks a clear separation between the Business Logic Layer (BLL) and Data Access Layer (DAL). Business logic is currently scattered across Domain entities (Task, TaskCategory), Domain services (RecurrenceCalculator, RecurringTaskGenerator), and even UnitOfWork. This creates maintainability issues, makes testing difficult, and violates the single responsibility principle. Creating a dedicated BLL layer will improve code organization, testability, and maintainability.

## What Changes

- Create new `src/bll/` directory structure for Business Logic Layer
- Extract business logic from Domain entities into dedicated BLL services
- Create BLL interfaces for task and category operations
- Refactor UnitOfWork to delegate business operations to BLL services
- Move recurrence calculation and task generation logic to BLL
- Create clear dependency flow: Presentation → BLL → DAL → Domain
- Maintain backward compatibility with existing DTOs and interfaces

## Capabilities

### New Capabilities
- `bll-task-service`: Dedicated business logic service for task operations (create, update, status transitions, priority changes, tagging)
- `bll-category-service`: Business logic service for category management and task-category assignments
- `bll-recurrence-service`: Business logic service for recurring task handling and next-occurrence calculations
- `bll-organization`: Define the overall BLL layer architecture including service patterns, interfaces, and dependency injection approach

### Modified Capabilities
- None - this is a new architectural layer without changing existing functional requirements

## Impact

- **New directories**: `src/bll/` with services and interfaces
- **Modified files**: 
  - `src/data/unit-of-work/UnitOfWork.ts` - refactor to use BLL services
  - `src/domain/Task.ts` - simplify to pure entity, remove business logic
  - `src/domain/TaskCategory.ts` - simplify to pure entity
  - `src/domain/RecurrenceCalculator.ts` - move to BLL layer
  - `src/domain/RecurringTaskGenerator.ts` - move to BLL layer
- **Test impact**: Tests will need to be reorganized to test BLL services independently
- **No breaking changes** to public APIs or DTOs
