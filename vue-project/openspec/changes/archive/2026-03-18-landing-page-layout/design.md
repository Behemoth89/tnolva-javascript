## Context

This proposal integrates all previous proposals into a complete user experience. The landing page serves as the entry point, with clear paths to login/register. After authentication, users enter the main application layout.

## Goals / Non-Goals

**Goals:**

- Public landing page with call-to-action
- Authenticated layout with header
- Company selector in header
- Logout functionality
- Smooth navigation flow

**Non-Goals:**

- Business features (future)
- Dashboard (future)
- Complex navigation

## Decisions

### 1. Separate Landing and Main Layouts

**Decision**: Use different layouts for public and authenticated pages
**Rationale**:

- Clean separation of concerns
- Easy to add different nav for each
- Standard Vue Router pattern

### 2. Header Component Location

**Decision**: Include header in MainView layout
**Rationale**:

- Consistent across all authenticated pages
- Easy to maintain
- Contains company selector and user menu

## Risks / Trade-offs

| Risk                            | Mitigation                                          |
| ------------------------------- | --------------------------------------------------- |
| No company selected after login | Force company selection before entering main layout |
