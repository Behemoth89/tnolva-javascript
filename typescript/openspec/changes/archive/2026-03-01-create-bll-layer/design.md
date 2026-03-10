## Context

The current codebase has a mixed architecture where business logic is scattered across:
- **Domain entities** (`Task.ts`, `TaskCategory.ts`): Contain state management and transition logic
- **Domain services** (`RecurrenceCalculator.ts`, `RecurringTaskGenerator.ts`): Contain business rules
- **UnitOfWork** (`UnitOfWork.ts`): Contains task completion with recurrence generation logic

This violates the Single Responsibility Principle and makes testing difficult. The DAL (Data Access Layer) is well-defined in `src/data/` with repositories, but there's no clear BLL separation.

**Goals:**
1. Create clear separation between BLL and DAL
2. Make business logic testable in isolation
3. Maintain clean dependency flow: Presentation → BLL → DAL → Domain
4. Keep backward compatibility with existing DTOs and interfaces

## Goals / Non-Goals

**Goals:**
- Create `src/bll/` directory structure with services and interfaces
- Extract business logic from Domain entities into BLL services
- Move recurrence calculation from Domain to BLL
- Refactor UnitOfWork to delegate to BLL services
- Define service interfaces (`ITaskService`, `ICategoryService`, `IRecurrenceService`)
- Create a `BllServiceFactory` for dependency injection

**Non-Goals:**
- Changing the underlying storage mechanism (LocalStorage remains)
- Modifying existing DTOs or public API contracts
- Adding new features beyond architectural refactoring
- Changing the Domain entity classes (they become simpler data holders)

## Decisions

### Decision 1: Service-Based BLL Architecture
**Choice:** Create dedicated service classes for each domain concept
**Rationale:** Following clean architecture principles, services encapsulate business logic. Alternative considered: using domain classes with rich behavior, but this keeps Domain with too many responsibilities.

### Decision 2: BLL Depends on Repository Interfaces
**Choice:** BLL services use `ITaskRepository` and `ICategoryRepository` interfaces, not implementations
**Rationale:** Maintains dependency inversion principle. Allows for future DI and testing with mocks.

### Decision 3: UnitOfWork Delegates to BLL Services
**Choice:** Refactor UnitOfWork to use BLL services for business operations
**Rationale:** UnitOfWork's role is transaction coordination, not business logic. This makes UoW simpler and more focused.

### Decision 4: Keep Domain Entities as Simple Data Holders
**Choice:** Domain entities (`Task`, `TaskCategory`) become plain objects with minimal logic
**Rationale:** Domain entities represent data, BLL services handle behavior. This separation makes testing easier.

### Decision 5: Factory Pattern for Service Creation
**Choice:** Create `BllServiceFactory` to instantiate services with UoW
**Rationale:** Provides central place for dependency management. Simplifies service consumption.

### Decision 6: Maintain RecurrenceCalculator and RecurringTaskGenerator in BLL
**Choice:** Move these from `src/domain/` to `src/bll/services/`
**Rationale:** These are business logic components, not domain data. They belong in BLL.

## Risks / Trade-offs

**[Risk] Refactoring existing UnitOfWork tests**
- **Mitigation:** Update tests to mock BLL services instead of testing business logic directly

**[Risk] Breaking existing code that directly uses Domain entities**
- **Mitigation:** Keep Domain entity public API unchanged; only internal implementation moves to BLL

**[Risk] Performance overhead from additional service layer**
- **Mitigation:** Services are thin wrappers; minimal performance impact. TypeScript compiles to efficient JavaScript.

**[Risk] Confusion about where logic should live during development**
- **Mitigation:** Document clear guidelines: business rules in BLL, data structure in Domain, persistence in DAL

**[Risk] Circular dependency between BLL and DAL**
- **Mitigation:** BLL depends only on repository interfaces (in `src/interfaces/`), breaking potential cycles

## Migration Plan

1. **Phase 1: Create BLL structure**
   - Create `src/bll/` directory
   - Create `src/bll/interfaces/` with service interfaces
   - Create `src/bll/services/` with service implementations
   - Create `src/bll/index.ts` for exports

2. **Phase 2: Implement services**
   - Implement `TaskService` with task business logic
   - Implement `CategoryService` with category business logic
   - Implement `RecurrenceService` with recurrence handling
   - Create `BllServiceFactory`

3. **Phase 3: Refactor consumers**
   - Update UnitOfWork to use BLL services
   - Update any other code using domain logic directly

4. **Phase 4: Simplify Domain**
   - Remove business logic from `Task.ts`, keep only data structure
   - Remove business logic from `TaskCategory.ts`
   - Move `RecurrenceCalculator.ts` and `RecurringTaskGenerator.ts` to BLL

## Open Questions

- Should BLL services be singleton instances or created per-operation?
- How to handle service-to-service dependencies (e.g., TaskService needing RecurrenceService)?
- Should we introduce an IoC container or keep simple factory pattern?
