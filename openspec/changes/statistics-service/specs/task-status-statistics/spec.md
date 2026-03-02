# Specification: Task Status Statistics

## Overview

Provides statistics about tasks grouped by their status (TODO, IN_PROGRESS, DONE, CANCELLED).

## ADDED Requirements

### Requirement: Status Distribution

The system SHALL provide the count of tasks for each status value.

#### Scenario: Get Status Counts
- **WHEN** getTaskStatusStatistics() is called
- **THEN** the system SHALL return an object with counts for: TODO, IN_PROGRESS, DONE, CANCELLED

#### Scenario: Empty Task List
- **WHEN** getTaskStatusStatistics() is called with no tasks
- **THEN** all status counts SHALL be zero

### Requirement: Total Task Count

The system SHALL provide the total number of tasks across all statuses.

#### Scenario: Total Count
- **WHEN** getTaskStatusStatistics() is called
- **THEN** the result SHALL include a total property equal to the sum of all status counts

### Requirement: Status Percentage

The system SHALL provide the percentage of tasks in each status.

#### Scenario: Calculate Percentages
- **WHEN** getTaskStatusStatistics() is called with tasks
- **THEN** each status SHALL have a percentage value (0-100) based on total tasks
