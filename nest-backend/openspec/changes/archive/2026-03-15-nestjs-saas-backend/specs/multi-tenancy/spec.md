## ADDED Requirements

### Requirement: BaseEntity includes companyId field
All entities MUST inherit from BaseEntity which includes a companyId UUID field for tenant isolation.

#### Scenario: BaseEntity structure
- **WHEN** a new entity is created extending BaseEntity
- **THEN** entity automatically has id (UUID), createdAt, updatedAt, and companyId fields

#### Scenario: UUID primary key generation
- **WHEN** a new entity record is created
- **THEN** system generates a UUID v4 as the primary key

#### Scenario: Timestamps auto-population
- **WHEN** a new entity record is created
- **THEN** system automatically sets createdAt and updatedAt timestamps
- **AND** system updates updatedAt on record modification

### Requirement: Tenant isolation via companyId
All database queries MUST filter by companyId to ensure data isolation between tenants.

#### Scenario: Repository applies companyId filter
- **WHEN** a repository method is called to fetch entities
- **THEN** system automatically filters results by companyId from the current user context

#### Scenario: Create entity with companyId
- **WHEN** a user creates a new entity record
- **THEN** system automatically sets companyId from the authenticated user's company

#### Scenario: Cross-company access denied
- **WHEN** a user attempts to access records from another company
- **THEN** system returns HTTP 403 Forbidden or HTTP 404 Not Found

### Requirement: Multi-tenancy architecture supports future migration
The architecture MUST support future migration to row-level security or separate databases per tenant.

#### Scenario: BaseEntity designed for RLS
- **WHEN** future migration to RLS is needed
- **THEN** companyId field is already present on all entities
- **AND** no schema changes are required for RLS implementation

#### Scenario: BaseEntity designed for separate databases
- **WHEN** future migration to separate databases per tenant is needed
- **THEN** companyId provides the logical key for database partitioning
- **AND** repository pattern abstracts data access for easy migration
