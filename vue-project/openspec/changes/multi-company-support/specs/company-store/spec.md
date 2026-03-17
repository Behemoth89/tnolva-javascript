## ADDED Requirements

### Requirement: Auth Store Must Track Selected Company

The auth store SHALL track the currently selected company ID.

#### Scenario: Set selected company

- **WHEN** user selects a company
- **THEN** selectedCompanyId SHALL be stored

#### Scenario: Clear selected company

- **WHEN** user logs out
- **THEN** selectedCompanyId SHALL be cleared

### Requirement: Auth Store Must Auto-Select Single Company

The auth store SHALL automatically select company when user has only one.

#### Scenario: Single company

- **WHEN** user has exactly one company
- **THEN** that company SHALL be auto-selected

#### Scenario: Multiple companies

- **WHEN** user has multiple companies
- **THEN** no company SHALL be auto-selected (user must choose)

### Requirement: Auth Store Must Provide Companies List

The auth store SHALL provide list of user's companies.

#### Scenario: Get companies

- **WHEN** calling getCompanies()
- **THEN** returns array of company associations

### Requirement: Auth Store Must Switch Company

The auth store SHALL handle company switching via backend.

#### Scenario: Switch company

- **WHEN** user requests company switch
- **THEN** API SHALL be called with new companyId
- **AND** new access token SHALL be stored
- **AND** selectedCompanyId SHALL be updated
