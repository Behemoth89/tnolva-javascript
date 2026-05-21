# Phase 8: implement-organizer-flow-create-event-classes-checkpoints-qr - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 8-implement-organizer-flow-create-event-classes-checkpoints-qr
**Areas discussed:** Authorization & navigation

---

## Authorization & Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Separate login page | User clicks "Organizer" in header → new route /organizer with login form | |
| Same auth + role check | Login once, JWT claims decide role. /organizer route checks token role. | ✓ |
| Role from API | Backend has /api/v1/organiser/Organisations endpoint — use it to determine access | |

**User's choice:** Same auth + role check
**Notes:** User clarified that organiser role is provisioned by system administrator (e.g. via seeded `organiser@taltech.ee` account or via Areas/UserAdmin). The role is on the authenticated AppUser, checked via JWT claim.

---

## Role Verification

| Option | Description | Selected |
|--------|-------------|----------|
| JWT claim check | Organizer dashboard only shows after checking organiser claim in JWT | ✓ |
| Backend enforcement | Backend returns 403 if user lacks organiser role — frontend shows "Access denied" | |
| Both frontend + backend | Frontend guards route, backend also checks role on each request | |

**User's choice:** JWT claim check
**Notes:** Route guard on /organizer checks JWT claim before rendering dashboard.

---

## Organizer Navigation Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Separate route section | Separate /organizer section with its own nav (sidebar or tab) | |
| Contest-contextual | In-contest "Manage" link, breadcrumb back to contest from organizer views | |
| Dashboard entry | Organizer button in header → full-screen dashboard, exit via logo/home | ✓ |

**User's choice:** Dashboard entry
**Notes:** Organizer enters via dashboard entry (button in header → full-screen dashboard).

---

## Dashboard Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Contest cards grid | Cards per contest with key stats (date, class count, team count) | |
| List view | Table with date, name, status (draft/open/closed), actions | ✓ |
| Calendar | Calendar month view with contests marked on dates | |

**User's choice:** List view
**Notes:** Dashboard shows list view of organizer's contests with date, name, status (draft/open/closed), actions.

---

## Contest List Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Manage existing events | List of their events with actions: edit, view results, manage checkpoints | |
| Create-first | Prominent "Create new event" button, existing events below | |
| New organizer | Empty state with "Create your first event" CTA | |

**User's choice:** all of the above
**Notes:** Support all three states: manage existing events, create-first prompt, new organizer empty state with CTA.

---

## Contest Scoping

| Option | Description | Selected |
|--------|-------------|----------|
| Owner-based | Organizer sees only contests they created. Contests have ownerId. | ✓ |
| Org-scoped | User belongs to Organisation X, sees all contests under that org | |
| All contests | All contests are visible to all organizers (system admin assigns role) | |

**User's choice:** Owner-based
**Notes:** Backend returns only contests where ownerId matches authenticated user.

---

## the agent's Discretion

None — user made all decisions during discussion.

## Deferred Ideas

None — discussion stayed within phase scope.