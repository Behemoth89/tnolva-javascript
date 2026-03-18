# App Header Specification

## Purpose

The app header component displays user information and navigation controls for authenticated users.

## ADDED Requirements

### Requirement: Header Must Show User Email

The header SHALL display the authenticated user's email.

#### Scenario: User email visible

- **WHEN** user is authenticated
- **THEN** header SHALL show user's email address

### Requirement: Header Must Include Company Selector

The header SHALL include the company selector component.

#### Scenario: Company selector in header

- **WHEN** header renders
- **THEN** company selector SHALL be included

### Requirement: Header Must Have Logout Button

The header SHALL include a logout button.

#### Scenario: Logout button exists

- **WHEN** user is authenticated
- **THEN** logout button SHALL be visible

### Requirement: Header Must Handle Logout

The header SHALL logout user when clicked.

#### Scenario: Click logout

- **WHEN** user clicks logout button
- **THEN** user SHALL be logged out
- **AND** redirected to landing page
