## ADDED Requirements

### Requirement: BLL Task Create DTO
The BLL layer SHALL have its own task create DTO that includes categoryId for category assignment.

#### Scenario: BLL create DTO includes categoryId
- **WHEN** a BLL task create DTO is used
- **THEN** it SHALL include an optional `categoryId` field for category assignment

### Requirement: BLL Task Update DTO
The BLL layer SHALL have its own task update DTO that includes categoryId for changing category assignment.

#### Scenario: BLL update DTO includes categoryId
- **WHEN** a BLL task update DTO is used
- **THEN** it SHALL include an optional `categoryId` field for changing category assignment

### Requirement: BLL Task DTO with Category
The BLL layer SHALL have a task DTO that includes category information for display purposes.

#### Scenario: BLL task DTO includes category info
- **WHEN** querying tasks for display
- **THEN** the BLL task DTO SHALL include `categoryId`, `categoryName`, and `categoryColor` fields
- **AND** these fields SHALL be populated from the category junction table

### Requirement: Service uses BLL DTOs
The TaskService SHALL use BLL-specific DTOs for input and output, not the data layer DTOs.

#### Scenario: Service create uses BLL DTO
- **WHEN** TaskService.createAsync() is called
- **THEN** it SHALL accept IBllTaskCreateDto

#### Scenario: Service query returns BLL DTO
- **WHEN** TaskService.getAllAsync() or getByIdAsync() is called
- **THEN** it SHALL return IBllTaskDto with category info
