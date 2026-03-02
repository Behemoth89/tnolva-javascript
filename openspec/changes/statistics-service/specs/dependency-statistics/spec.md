# Specification: Dependency Statistics

## Overview

Provides statistics about task dependencies and blockers.

## ADDED Requirements

### Requirement: Tasks With Dependencies

The system SHALL provide the count of tasks that have dependencies (are depended upon by other tasks).

#### Scenario: Get Dependent Tasks Count
- **WHEN** getDependencyStatistics() is called
- **THEN** the result SHALL include count of tasks that other tasks depend on

### Requirement: Blocked Tasks

The system SHALL provide the count of tasks that are blocked (have unmet dependencies).

#### Scenario: Get Blocked Tasks Count
- **WHEN** getDependencyStatistics() is called
- **THEN** the result SHALL include count of tasks with dependencies not yet satisfied

### Requirement: Dependencies Per Task

The system SHALL provide statistics about how many dependencies each task has.

#### Scenario: Dependency Count Distribution
- **WHEN** getDependencyStatistics() is called
- **THEN** the result SHALL include distribution of tasks by number of dependencies

### Requirement: Subtask Count

The system SHALL provide the count of subtasks (SUBTASK dependency type).

#### Scenario: Get Subtask Count
- **WHEN** getDependencyStatistics() is called
- **THEN** the result SHALL include count of subtask relationships

### Requirement: Circular Dependency Detection

The system SHALL indicate if any circular dependencies exist.

#### Scenario: Detect Cycles
- **WHEN** getDependencyStatistics() is called
- **THEN** the result SHALL include a flag indicating whether circular dependencies exist
