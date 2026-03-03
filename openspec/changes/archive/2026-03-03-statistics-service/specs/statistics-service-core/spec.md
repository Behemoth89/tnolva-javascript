# Specification: Statistics Service Core

## Overview

Defines the core architecture and interfaces for the Statistics Service, including the service interface, base statistics types, and date range enums.

## ADDED Requirements

### Requirement: Statistics Service Interface

The system SHALL provide an IStatisticsService interface in the BLL layer that exposes methods for retrieving various statistics about tasks, categories, recurring tasks, and dependencies.

#### Scenario: Service Registration
- **WHEN** the BllServiceFactory is initialized
- **THEN** the StatisticsService SHALL be registered and accessible via the factory

#### Scenario: Service Method Availability
- **WHEN** a consumer obtains the IStatisticsService
- **THEN** the service SHALL provide methods for: task status, priority, time-based, category, recurring task, and dependency statistics

### Requirement: Statistics Result Types

The system SHALL define specific interface types for each statistics result to ensure type safety.

#### Scenario: Type Safety
- **WHEN** calling any statistics method
- **THEN** the return type SHALL be a specific interface matching the requested statistics type

### Requirement: Date Range Enum

The system SHALL provide an EDateRange enum for common time period queries.

#### Scenario: Date Range Options
- **WHEN** a time-based statistics method is called
- **THEN** it SHALL support at least: TODAY, THIS_WEEK, THIS_MONTH, ALL

### Requirement: Statistics Summary

The system SHALL provide a method to retrieve a summary of all statistics at once.

#### Scenario: Full Summary
- **WHEN** getSummary() is called
- **THEN** the system SHALL return an object containing all available statistics
