## ADDED Requirements

### Requirement: Company Selector Must Display Available Companies

The company selector SHALL show all companies the user has access to.

#### Scenario: Show company list

- **WHEN** user has multiple companies
- **THEN** company selector SHALL display all available companies

### Requirement: Company Selector Must Show Current Selection

The company selector SHALL indicate which company is currently selected.

#### Scenario: Current company displayed

- **WHEN** company is selected
- **THEN** company selector SHALL show current company name

### Requirement: Company Selector Must Allow Switching

The company selector SHALL allow user to switch between companies.

#### Scenario: Switch company

- **WHEN** user selects different company
- **THEN** company context SHALL switch to selected company
- **AND** new token SHALL be obtained from backend

### Requirement: Company Selector Must Show for Multiple Companies

The company selector SHALL be visible when user has more than one company.

#### Scenario: Multiple companies

- **WHEN** user has 2+ companies
- **THEN** company selector SHALL be visible

### Requirement: Company Selector Must Be Hidden for Single Company

The company selector MAY be hidden when user has only one company.

#### Scenario: Single company

- **WHEN** user has exactly 1 company
- **THEN** company selector MAY be hidden (company auto-selected)
