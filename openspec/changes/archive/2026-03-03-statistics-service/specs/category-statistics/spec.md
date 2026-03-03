# Specification: Category Statistics

## Overview

Provides statistics about task distribution across categories.

## ADDED Requirements

### Requirement: Tasks Per Category

The system SHALL provide the count of tasks for each category.

#### Scenario: Get Category Task Counts
- **WHEN** getCategoryStatistics() is called
- **THEN** the result SHALL include task count for each existing category

#### Scenario: No Categories
- **WHEN** getCategoryStatistics() is called with no categories
- **THEN** the result SHALL show zero tasks across an empty category list

### Requirement: Uncategorized Tasks

The system SHALL provide the count of tasks that have no category assigned.

#### Scenario: Uncategorized Count
- **WHEN** getCategoryStatistics() is called
- **THEN** the result SHALL include a count of tasks without category assignments

### Requirement: Category Distribution

The system SHALL provide the percentage distribution of tasks across categories.

#### Scenario: Calculate Distribution
- **WHEN** getCategoryStatistics() is called with tasks
- **THEN** each category SHALL have a percentage of total tasks

### Requirement: Tasks With Multiple Categories

The system SHALL correctly handle tasks that belong to multiple categories.

#### Scenario: Multi-category Tasks
- **WHEN** a task has multiple category assignments
- **THEN** it SHALL be counted in each assigned category's statistics
