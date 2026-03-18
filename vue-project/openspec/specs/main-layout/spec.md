# Main Layout Specification

## Purpose

The main layout provides the authenticated application shell with header and content area.

## ADDED Requirements

### Requirement: Main Layout Must Show Header

The main layout SHALL include a header component.

#### Scenario: Header visible

- **WHEN** authenticated user is in main layout
- **THEN** header component SHALL be visible

### Requirement: Main Layout Must Have Content Area

The main layout SHALL provide a content area for page content.

#### Scenario: Content area exists

- **WHEN** main layout renders
- **THEN** router-view content SHALL be visible

### Requirement: Main Layout Requires Authentication

The main layout SHALL only be accessible to authenticated users.

#### Scenario: Unauthenticated access

- **WHEN** unauthenticated user tries to access main layout
- **THEN** user SHALL be redirected to /login
