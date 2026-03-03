# Specification: Task Priority Statistics

## Overview

Provides statistics about tasks grouped by their priority level (LOW, MEDIUM, HIGH, URGENT).

## ADDED Requirements

### Requirement: Priority Distribution

The system SHALL provide the count of tasks for each priority value.

#### Scenario: Get Priority Counts
- **WHEN** getTaskPriorityStatistics() is called
- **THEN** the system SHALL return an object with counts for: LOW, MEDIUM, HIGH, URGENT

#### Scenario: Empty Task List
- **WHEN** getTaskPriorityStatistics() is called with no tasks
- **THEN** all priority counts SHALL be zero

### Requirement: Total Task Count

The system SHALL provide the total number of tasks across all priorities.

#### Scenario: Total Count
- **WHEN** getTaskPriorityStatistics() is called
- **THEN** the result SHALL include a total property equal to the sum of all priority counts

### Requirement: Priority Percentage

The system SHALL provide the percentage of tasks in each priority level.

#### Scenario: Calculate Percentages
- **WHEN** getTaskPriorityStatistics() is called with tasks
- **THEN** each priority SHALL have a percentage value (0-100) based on total tasks
