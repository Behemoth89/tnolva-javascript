## Why

The current interface organization in the project has structural inconsistencies: interfaces are scattered in the root of `src/interfaces/` directory without proper categorization, and some files contain multiple interface definitions (e.g., IRecurringTask.ts contains IRecurringTask, IRecurringTaskCreateDto, and IRecurringTaskUpdateDto). This makes the codebase harder to navigate and maintain. Reorganizing interfaces into logical subfolders (dtos, entities, repositories) and separating combined interfaces will improve code clarity and follow better separation of concerns principles.

## What Changes

- Create proper subfolder structure for interfaces (dtos/, entities/, repositories/) if not already complete
- Move entity interfaces (ITask, IRecurringTask, IRecurrenceTemplate, etc.) to `src/interfaces/entities/`
- Move DTO interfaces (ITaskCreateDto, ITaskUpdateDto, etc.) to `src/interfaces/dtos/`
- Move repository interfaces to `src/interfaces/repositories/`
- **Rename entity interfaces with Entity suffix**: ITask → ITaskEntity, IRecurringTask → IRecurringTaskEntity, IRecurrenceTemplate → IRecurrenceTemplateEntity, ITaskCategory → ITaskCategoryEntity, ITaskDependency → ITaskDependencyEntity, ITaskRecurringLink → ITaskRecurringLinkEntity
- Separate combined interface files into individual files (e.g., IRecurringTaskCreateDto.ts, IRecurringTaskUpdateDto.ts separate from IRecurringTaskEntity.ts)
- Update all import statements throughout the project to reflect new file locations and names
- Update index.ts exports to match new structure

## Capabilities

### New Capabilities
- `interface-reorganization`: Reorganize all interfaces into proper subfolders (dtos, entities, repositories)
- `interface-separation`: Separate combined interfaces into individual files for better modularity

### Modified Capabilities
- None. This is a pure refactoring change that doesn't modify any functional requirements or behavior.

## Impact

- **Affected Code**: 
  - All files importing from `src/interfaces/` will need updated import paths
  - `src/interfaces/index.ts` will need updated exports
  - Files in `src/bll/`, `src/data/`, `src/domain/`, and `src/tests/` that reference interfaces
- **No Breaking API Changes**: The interfaces themselves remain unchanged, only their file locations
- **File Movement**: 20+ interface files will be moved to new locations
