# Specification: Recurring Task Statistics

## Overview

Provides statistics about recurring task patterns and templates.

## ADDED Requirements

### Requirement: Active Recurring Templates

The system SHALL provide the count of active recurrence templates.

#### Scenario: Get Active Template Count
- **WHEN** getRecurringTaskStatistics() is called
- **THEN** the result SHALL include count of recurrence templates with ACTIVE status

### Requirement: Recurring Tasks Per Template

The system SHALL provide the count of generated recurring tasks per template.

#### Scenario: Tasks Per Template
- **WHEN** getRecurringTaskStatistics() is called
- **THEN** the result SHALL include breakdown of generated tasks by template

### Requirement: Manual vs Generated Ratio

The system SHALL provide the ratio of manually created tasks to generated recurring tasks.

#### Scenario: Calculate Ratio
- **WHEN** getRecurringTaskStatistics() is called
- **THEN** the result SHALL include counts for: manually created tasks, generated recurring tasks

### Requirement: Templates By Frequency

The system SHALL provide distribution of templates by their recurrence frequency.

#### Scenario: Frequency Distribution
- **WHEN** getRecurringTaskStatistics() is called
- **THEN** the result SHALL include breakdown of templates by frequency (daily, weekly, monthly, etc.)
