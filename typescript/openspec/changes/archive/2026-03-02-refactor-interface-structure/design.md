## Context

### Current State
- All interfaces reside in `src/interfaces/` root directory
- Some files contain multiple interface definitions (e.g., `IRecurringTask.ts` has `IRecurringTask`, `IRecurringTaskCreateDto`, `IRecurringTaskUpdateDto`)
- Empty subfolders exist: `dtos/`, `entities/`, `repositories/`
- No clear separation between entity interfaces, DTOs, and repository interfaces

### Constraints
- Project rule: All interfaces MUST be prefixed with capital `I`
- Must maintain backward compatibility for type signatures
- Must update all import statements across the codebase

### Stakeholders
- Developers maintaining the codebase
- Future developers navigating the interface structure

## Goals / Non-Goals

**Goals:**
- Reorganize interfaces into logical subfolders (entities/, dtos/, repositories/)
- Rename entity interfaces with Entity suffix for clarity
- Separate combined interfaces into individual files
- Update all imports throughout the project
- Maintain all interface type signatures unchanged

**Non-Goals:**
- Modify any interface definitions or behavior
- Add new interfaces (pure refactoring)
- Change the BLL interface locations (they stay in `src/bll/interfaces/`)
- Change data layer adapter interfaces (they stay in `src/data/`)

## Decisions

### 1. Interface Naming Convention for Entities
**Decision:** Add "Entity" suffix to entity interfaces (e.g., `ITaskEntity` instead of `ITask`)

**Rationale:**
- Makes the interface purpose immediately clear when imported
- Distinguishes entity interfaces from DTOs and repository interfaces
- Follows DDD conventions used in enterprise TypeScript projects
- Self-documenting when combined with folder structure

**Alternatives Considered:**
- Keep current naming: Less clear, but requires fewer changes
- Remove `I` prefix: Would conflict with project's explicit rule requiring `I` prefix

### 2. Folder Structure for Interfaces
**Decision:** Use three subfolders: `entities/`, `dtos/`, `repositories/`

**Proposed Mapping:**

| Current Interface | New Location | New Name |
|------------------|--------------|-----------|
| ITask.ts | entities/ | ITaskEntity.ts |
| ITaskCreateDto.ts | dtos/ | ITaskCreateDto.ts |
| ITaskUpdateDto.ts | dtos/ | ITaskUpdateDto.ts |
| IRecurringTask.ts | entities/ | IRecurringTaskEntity.ts |
| IRecurringTaskCreateDto.ts | dtos/ | IRecurringTaskCreateDto.ts |
| IRecurringTaskUpdateDto.ts | dtos/ | IRecurringTaskUpdateDto.ts |
| IRecurrenceTemplate.ts | entities/ | IRecurrenceTemplateEntity.ts |
| ITaskCategory.ts | entities/ | ITaskCategoryEntity.ts |
| ITaskCategoryCreateDto.ts | dtos/ | ITaskCategoryCreateDto.ts |
| ITaskCategoryUpdateDto.ts | dtos/ | ITaskCategoryUpdateDto.ts |
| ITaskDependency.ts | entities/ | ITaskDependencyEntity.ts |
| ITaskDependencyCreateDto.ts | dtos/ | ITaskDependencyCreateDto.ts |
| ITaskRecurringLink.ts | entities/ | ITaskRecurringLinkEntity.ts |
| ITaskRepository.ts | repositories/ | ITaskRepository.ts |
| ICategoryRepository.ts | repositories/ | ICategoryRepository.ts |
| IRecurrenceTemplateRepository.ts | repositories/ | IRecurrenceTemplateRepository.ts |
| IRecurringTaskRepository.ts | repositories/ | IRecurringTaskRepository.ts |
| ITaskDependencyRepository.ts | repositories/ | ITaskDependencyRepository.ts |
| ITaskRecurringLinkRepository.ts | repositories/ | ITaskRecurringLinkRepository.ts |
| IRepository.ts | repositories/ | IRepository.ts |

**Base interfaces:**
- `IEntityId.ts` → entities/ (used by other entities)
- `IBaseEntity.ts` → entities/ (used by other entities)
- `IInterval.ts` → entities/ (used by entity interfaces)
- `ISubtaskTemplate.ts` → entities/ (used by recurrence template)

**Unit of Work / Factory:**
- `IUnitOfWork.ts` → root interfaces/ (cross-cutting)
- `IUnitOfWorkFactory.ts` → root interfaces/ (cross-cutting)

### 3. Separation of Combined Interfaces
**Decision:** Split all files containing multiple interface definitions

**Files to split:**
- `IRecurringTask.ts` → `IRecurringTaskEntity.ts`, `IRecurringTaskCreateDto.ts`, `IRecurringTaskUpdateDto.ts`
- `ITaskDependency.ts` → `ITaskDependencyEntity.ts`, `ITaskDependencyCreateDto.ts`
- `ISubtaskTemplate.ts` → `ISubtaskTemplate.ts`, `ISubtaskTemplateCreateDto.ts`

### 4. Import Update Strategy
**Decision:** Update imports in all affected files after moving interfaces

**Affected directories:**
- `src/bll/` - Service implementations
- `src/data/` - Repositories and adapters
- `src/domain/` - Domain entities
- `src/tests/` - Test files
- `src/interfaces/index.ts` - Central export file

**Approach:**
1. Move interface files to new locations
2. Update all import paths using find/replace
3. Update `src/interfaces/index.ts` to export from new paths
4. Verify TypeScript compilation succeeds

## Risks / Trade-offs

### Risk: Breaking Existing Imports
**Description:** Many files import from the old paths
**Mitigation:** 
- Not a concern - project is in development phase
- All imports will be updated as part of the refactoring
- Run TypeScript compiler to catch any missed imports

### Risk: Circular Dependencies
**Description:** Moving interfaces might create circular import chains
**Mitigation:**
- Check for circular dependencies after each batch of moves
- Use interface-only imports (type imports) to break cycles
- Keep base interfaces (IEntityId, IBaseEntity) in entities/ folder

### Risk: Large Number of Files to Update
**Description:** 20+ interface files + all importing files
**Mitigation:**
- Use IDE refactoring tools for bulk updates
- Test frequently during implementation

### Trade-off: Completeness vs. Safety
**Decision:** Prioritize safety - do comprehensive testing at each step rather than bulk updates

## Migration Plan

1. **Phase 1: Prepare**
   - Verify empty subfolders exist (`entities/`, `dtos/`, `repositories/`)
   - Run tests to establish baseline

2. **Phase 2: Move Entity Interfaces**
   - Move base interfaces first (IEntityId, IBaseEntity, IInterval)
   - Move entity interfaces with Entity suffix rename
   - Update imports in domain layer

3. **Phase 3: Move DTO Interfaces**
   - Move DTOs to dtos/ folder
   - Separate combined DTO files
   - Update imports in BLL layer

4. **Phase 4: Move Repository Interfaces**
   - Move repository interfaces to repositories/ folder
   - Update imports in data layer

5. **Phase 5: Update Index and Verify**
   - Update `src/interfaces/index.ts` exports
   - Run TypeScript compilation
   - Run all tests

6. **Rollback Plan:**
   - If issues occur, revert file moves via version control
   - No database or runtime changes needed - pure source code refactoring
