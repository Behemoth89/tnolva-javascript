## ADDED Requirements

### Requirement: Permission Helper Must Compare Roles

The permission helper SHALL compare user role against required role.

#### Scenario: Owner can do admin actions

- **WHEN** user is owner and required role is admin
- **THEN** canPerformAction SHALL return true

#### Scenario: Member cannot do owner actions

- **WHEN** user is member and required role is owner
- **THEN** canPerformAction SHALL return false

### Requirement: Permission Helper Must Check Role Level

The permission helper SHALL use numeric levels for comparison.

#### Scenario: Role level comparison

- **WHEN** comparing roles
- **THEN** use levels: owner=3, admin=2, member=1

### Requirement: Role-Based Component Must Show/Hide

A component SHALL conditionally render based on user role.

#### Scenario: User has required role

- **WHEN** user role meets requirement
- **THEN** component content SHALL be visible

#### Scenario: User lacks required role

- **WHEN** user role does not meet requirement
- **THEN** component content SHALL be hidden or show disabled state
