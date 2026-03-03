## ADDED Requirements

### Requirement: UI bridge service
The UI SHALL have a bridge service that connects UI components to BLL services.

#### Scenario: Bridge service created
- **WHEN** the UI bridge service is implemented
- **THEN** it SHALL provide methods to call all BLL services (TaskService, CategoryService, etc.)
- **AND** it SHALL handle the translation between UI data formats and BLL DTOs

### Requirement: Task service bridge
The bridge SHALL provide task CRUD operations through TaskService.

#### Scenario: Task operations via bridge
- **WHEN** the UI needs to perform task operations
- **THEN** the bridge SHALL provide: getAllTasks(), getTaskById(), createTask(), updateTask(), deleteTask()

### Requirement: Category service bridge
The bridge SHALL provide category CRUD operations through CategoryService.

#### Scenario: Category operations via bridge
- **WHEN** the UI needs to perform category operations
- **THEN** the bridge SHALL provide: getAllCategories(), getCategoryById(), createCategory(), updateCategory(), deleteCategory()

### Requirement: Recurrence service bridge
The bridge SHALL provide recurrence template CRUD operations through RecurrenceService.

#### Scenario: Recurrence template operations via bridge
- **WHEN** the UI needs to perform recurrence template operations
- **THEN** the bridge SHALL provide: getAllTemplates(), getTemplateById(), createTemplate(), updateTemplate(), deleteTemplate()

### Requirement: Recurring task service bridge
The bridge SHALL provide recurring task CRUD operations through RecurringTaskService.

#### Scenario: Recurring task operations via bridge
- **WHEN** the UI needs to perform recurring task operations
- **THEN** the bridge SHALL provide: getAllRecurringTasks(), getRecurringTaskById(), createRecurringTask(), updateRecurringTask(), deleteRecurringTask()

### Requirement: Dependency service bridge
The bridge SHALL provide task dependency CRUD operations through TaskDependencyService.

#### Scenario: Dependency operations via bridge
- **WHEN** the UI needs to perform dependency operations
- **THEN** the bridge SHALL provide: getAllDependencies(), getDependencyById(), createDependency(), updateDependency(), deleteDependency()
