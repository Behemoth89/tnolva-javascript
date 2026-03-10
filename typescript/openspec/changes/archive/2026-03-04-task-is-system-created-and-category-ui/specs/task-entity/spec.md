## MODIFIED Requirements

### Requirement: Task entity structure
**From:** Task entity includes `recurrenceTemplateId` field
**To:** Task entity includes `isSystemCreated` boolean field

#### Scenario: Task entity has isSystemCreated field
- **WHEN** a task entity is created
- **THEN** the entity SHALL have an `isSystemCreated` boolean field
- **AND** the field SHALL default to `false` when not specified

#### Scenario: Task entity no longer has recurrenceTemplateId
- **WHEN** code creates or accesses a task entity
- **THEN** the entity SHALL NOT have a `recurrenceTemplateId` field
