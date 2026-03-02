# Proposal: Statistics Service

## Why

A task management system needs visibility into productivity metrics and task patterns. Without a statistics service, users cannot track their progress, identify bottlenecks, or make data-driven decisions about task management. A dedicated statistics service enables a comprehensive dashboard with real-time metrics about tasks, categories, recurring patterns, and dependencies.

## What Changes

- **New Statistics Service (BLL)**: Centralized service for computing all dashboard metrics
- **New Statistics Interfaces**: Define return types for various statistical queries
- **New Repository Methods**: Add aggregation methods to existing repositories if needed
- **New Entity Extensions**: Optional fields for tracking completion timestamps
- **Dashboard Integration**: Service layer ready for UI consumption

## Capabilities

### New Capabilities
- **statistics-service-core**: Core service architecture with statistics interfaces and types
- **task-status-statistics**: Task counts grouped by status (TODO, IN_PROGRESS, DONE, CANCELLED)
- **task-priority-statistics**: Task distribution by priority (LOW, MEDIUM, HIGH, URGENT)
- **task-time-statistics**: Time-based metrics (overdue, due today/this week, completion rates)
- **category-statistics**: Task distribution across categories
- **recurring-task-statistics**: Metrics about recurring task patterns
- **dependency-statistics**: Metrics about task dependencies and blockers

### Modified Capabilities
- None at this time. Statistics service is additive.

## Impact

- **New Files**: 
  - `src/bll/interfaces/IStatisticsService.ts` - Service interface
  - `src/bll/services/StatisticsService.ts` - Implementation
  - `src/interfaces/statistics/` - Statistics DTOs/interfaces
- **Modified Files**:
  - `src/bll/index.ts` - Export new service
  - `src/bll/BllServiceFactory.ts` - Register new service
- **No Breaking Changes**: Pure additive feature
