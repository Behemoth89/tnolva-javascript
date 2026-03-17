## Context

Role hierarchy: owner (3) > admin (2) > member (1). Owners can do everything, admins can do admin and member actions, members can only do member actions.

## Goals / Non-Goals

**Goals:**

- Get current role from auth store
- Create permission checking utility
- Add route guards for protected routes
- Create component for conditional rendering

**Non-Goals:**

- Role management UI (future feature)
- Backend role enforcement (already exists)

## Decisions

### 1. Role Level Comparison

**Decision**: Use numeric levels for role comparison
**Rationale**:

- Simple comparison: userLevel >= requiredLevel
- Easy to extend for new roles
- Matches backend hierarchy

### 2. Route Meta Fields

**Decision**: Use Vue Router meta fields for route permissions
**Rationale**:

- Standard Vue Router pattern
- Clean route configuration
- Easy to understand

## Risks / Trade-offs

| Risk                | Mitigation                                      |
| ------------------- | ----------------------------------------------- |
| No company selected | Require company selection before checking roles |
| Role not found      | Default to no access                            |
