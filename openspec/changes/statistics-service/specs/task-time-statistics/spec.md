# Specification: Task Time Statistics

## Overview

Provides time-based statistics about tasks including overdue tasks, due soon, and completion trends.

## ADDED Requirements

### Requirement: Overdue Tasks

The system SHALL provide the count of tasks where the dueDate is in the past and status is not DONE or CANCELLED.

#### Scenario: Get Overdue Count
- **WHEN** getTaskTimeStatistics() is called
- **THEN** the result SHALL include overdue count of tasks past their due date

#### Scenario: No Overdue Tasks
- **WHEN** no tasks are overdue
- **THEN** overdue count SHALL be zero

### Requirement: Due Today

The system SHALL provide the count of tasks due today.

#### Scenario: Get Due Today Count
- **WHEN** getTaskTimeStatistics() is called
- **THEN** the result SHALL include count of tasks with dueDate matching today

### Requirement: Due This Week

The system SHALL provide the count of tasks due within the next 7 days.

#### Scenario: Get Due This Week Count
- **WHEN** getTaskTimeStatistics() is called
- **THEN** the result SHALL include count of tasks with dueDate within the current week

### Requirement: Completed This Period

The system SHALL provide the count of tasks completed in the specified time period.

#### Scenario: Completed This Week
- **WHEN** getTaskTimeStatistics(THIS_WEEK) is called
- **THEN** the result SHALL include count of tasks with status DONE completed within the current week

### Requirement: No Due Date Handling

The system SHALL handle tasks without due dates appropriately.

#### Scenario: Tasks Without Due Date
- **WHEN** calculating time statistics
- **THEN** tasks with no dueDate SHALL NOT be counted in overdue, due today, or due this week
