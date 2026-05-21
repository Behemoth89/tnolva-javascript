---
phase: 08-implement-organizer-flow-create-event-classes-checkpoints-qr
plan: 02
subsystem: organiser-dashboard
tags: [organiser, dashboard, router, role-guard]
dependency_graph:
  requires: [08-01-PLAN.md]
  provides: [OrganizerDashboard route, Organiser nav button]
  affects: [src/router, src/components/AppHeader, src/views/OrganizerDashboard]
tech_stack:
  added: [requiresRole meta field, role-based route guard]
  patterns: [JWT payload parsing for role check, computed isOrganiser]
key_files:
  created:
    - src/views/OrganizerDashboard.vue
  modified:
    - src/router/index.ts
    - src/components/AppHeader.vue
decisions:
  - Role guard is UX-only (frontend check only); backend enforces on /api/v1/organiser/*
  - Organiser button only visible when JWT contains 'organiser' role
  - Empty state shows for new organizers with create CTA
metrics:
  duration_minutes: 5
  completed_date: "2026-05-21"
---

# Phase 08 Plan 02 Summary: Organiser Dashboard UI

## One-liner

Organizer dashboard with role-based access control and contest list view

## Commits

| Hash | Message |
|------|---------|
| cdded6a | feat(08-02): add organiser dashboard UI with role-based access |

## What was built

**Router (src/router/index.ts):**
- `/organizer` route → OrganizerDashboard.vue, requiresRole: 'organiser'
- `/organizer/contest/:id` route → OrganizerContest.vue, requiresRole: 'organiser'
- Role guard in `router.beforeEach` checks JWT payload.role

**AppHeader (src/components/AppHeader.vue):**
- `isOrganiser` computed: parses JWT payload.role
- Shows "Organiser" button only for organiser role
- `goToOrganizer()` navigates to `/organizer`

**OrganizerDashboard (src/views/OrganizerDashboard.vue):**
- Loads organisations and contests from organiser store on mount
- Displays contests in Element Plus table with status badges
- Status logic: upcoming (before openFrom), open (between openFrom and openTo), closed (after openTo)
- "Manage" button navigates to `/organizer/contest/:id`
- Empty state with create CTA for new organizers

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| T-08-04 | AppHeader | Button visibility controlled by JWT role check; backend also enforces |
| T-08-05 | router | Frontend guard is UX only; backend returns 403 for non-organisers |

## Verification

- AppHeader renders organiser button only for organiser role
- /organizer route redirects non-organisers away
- Dashboard shows contests list after loading
- TypeScript compiles: `npx tsc --noEmit` passes