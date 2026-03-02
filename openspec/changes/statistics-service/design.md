# Design: Statistics Service

## Context

The Task Management Utility currently provides CRUD operations for tasks, categories, recurring tasks, and dependencies. However, there is no way to derive meaningful insights from the data. Users need visibility into:
- Task completion rates
- Distribution by status and priority
- Time-based metrics (overdue, upcoming)
- Category-based organization insights
- Recurring task patterns
- Dependency/blocker analysis

The system uses TypeScript with a clean architecture (BLL/DAL separation), LocalStorage for persistence, and follows interface-driven design patterns.

## Goals / Non-Goals

**Goals:**
- Create a centralized StatisticsService in the BLL layer
- Define clear statistics interfaces for type-safe return types
- Implement core statistics using existing repository methods
- Make the service extensible for future statistics types
- Provide data in a format ready for dashboard consumption

**Non-Goals:**
- UI/Dashboard implementation (user explicitly said "do not plan UI")
- User/assignee statistics (no user entity exists)
- Historical trend analysis (requires data versioning)
- Export capabilities (CSV, PDF, etc.)
- Real-time push updates (polling-based is acceptable)

## Decisions

### 1. Statistics Service Location
**Decision:** Create as a BLL service following existing patterns  
**Rationale:** Aligns with current architecture (TaskService, CategoryService, etc.)  
**Alternative:** Could be a utility class, but service pattern allows dependency injection

### 2. Statistics Interface Design
**Decision:** Use specific DTO interfaces for each statistics type  
**Rationale:** Type safety, IntelliSense support, and clear contract  
**Alternative:** Single generic interface with union types - less type-safe

### 3. Data Access Pattern
**Decision:** Add query methods to existing repositories rather than new repositories  
**Rationale:** Statistics are derived from existing entities; no need for separate storage  
**Alternative:** New StatisticsRepository - would duplicate data access logic

### 4. Caching Strategy
**Decision:** No caching for v1 - compute on demand  
**Rationale:** Simplicity, data is already in LocalStorage (fast)  
**Alternative:** In-memory caching with TTL - can be added later if performance issues arise

### 5. Date Range Handling
**Decision:** Support relative ranges (today, this week, this month) as enums  
**Rationale:** Most dashboard use cases are relative, simpler API  
**Alternative:** Absolute date ranges - can be added as enhancement

## Risks / Trade-offs

- **[Performance]** → Statistics queries scan all tasks in LocalStorage. Mitigation: Add pagination or indexing if dataset grows large.
- **[Incomplete Data]** → Statistics may be skewed if tasks have null due dates. Mitigation: Handle nulls explicitly in calculations.
- **[Recurring Task Counting]** → Generated instances vs template tracking. Mitigation: Decide whether to count generated tasks or just templates.
- **[Dependency Cycles]** → Dependency graph traversal could be slow. Mitigation: Limit depth or use iterative approach.
- **[Category Statistics]** → Tasks can have multiple categories. Mitigation: Count tasks per category, handle many-to-many correctly.

## Open Questions

1. Should completedDate be added to ITaskEntity for completion time tracking?
2. Should the service support refresh events when tasks are modified?
3. How to handle very large task lists - pagination or lazy loading?
