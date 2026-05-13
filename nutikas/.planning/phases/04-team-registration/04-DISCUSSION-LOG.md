# Phase 4: Team Registration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 4-Team Registration
**Areas discussed:** Registration form UX, My Teams view location, Active team persistence

---

## Registration Form UX

| Option | Description | Selected |
|--------|-------------|----------|
| Modal/dialog | Overlay on contest detail — stays in context, lighter feel | ✓ |
| Dedicated page | Separate route — more screen space, bookmarkable, cleaner for form validation | |

**User's choice:** Modal/dialog
**Notes:** User prefers staying in context after clicking Register from ContestDetailView

---

| Option | Description | Selected |
|--------|-------------|----------|
| Radio buttons (single select) | Easier on mobile, shows all options at once | ✓ |
| Dropdown/picker | Cleaner for many classes, but requires modal-within-modal on mobile | |

**User's choice:** Radio buttons (single select)
**Notes:** Better for mobile — all classes visible without nested interaction

---

| Option | Description | Selected |
|--------|-------------|----------|
| Single text field (comma-separated) | Simple: "John, Jane, Bob", easier to validate and store as string | ✓ |
| Multi-field dynamic entry | Flexible but more complex to manage, requires dynamic add/remove | |

**User's choice:** Single text field (comma-separated)
**Notes:** Simple and sufficient for team member entry

---

| Option | Description | Selected |
|--------|-------------|----------|
| Inline per-field errors | Inline validation on blur or submit — shows error below field | ✓ |
| Error summary banner | Summary at top after submit attempt — less intrusive but slower feedback | |

**User's choice:** Inline per-field errors
**Notes:** Faster, more direct feedback per field

---

| Option | Description | Selected |
|--------|-------------|----------|
| Toast notification | Less intrusive, shows in-context after form closes | ✓ |
| Persistent inline message | Stays visible until dismissed, harder to miss | |
| Redirect to /race | Navigates away to the active race view | |

**User's choice:** Toast notification
**Notes:** Modal closes, user stays in ContestDetailView context

---

## My Teams View Location

| Option | Description | Selected |
|--------|-------------|----------|
| Tab/embedded in ContestDetailView | Tab on contest detail — users are already there when they register | |
| Separate route (/contests/:id/my-teams) | Separate route — cleaner separation of concerns | ✓ |

**User's choice:** Separate route (/contests/:id/my-teams)
**Notes:** Cleaner separation of concerns

---

| Option | Description | Selected |
|--------|-------------|----------|
| Simple list (card or row) | Simple list, team name + class + status | ✓ |
| Card grid | Grid layout with more visual info | |

**User's choice:** Simple list (card or row)
**Notes:** Mobile-friendly, readable

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tap row to open TeamDetailView | Link to the existing TeamDetailView route | |
| Expandable inline details | Expand inline to show markings and score | ✓ |

**User's choice:** Expandable inline details
**Notes:** User stays in My Teams context, can see team details without navigation

---

## Active Team Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| IndexedDB via Dexie | IndexedDB (via Dexie) — same storage as auth tokens, survives page refresh | ✓ |
| Pinia only (in-memory) | Pinia ref — simple but clears on refresh | |

**User's choice:** IndexedDB via Dexie
**Notes:** Consistent with existing auth token persistence approach

---

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-set last registered as active | Always auto-select the most recently registered team as active | |
| Require explicit selection | Let user explicitly choose which team is active for racing | ✓ |
| Skip for Phase 4 | Skip this for now, implement when we get to Phase 5 | |

**User's choice:** Require explicit selection
**Notes:** User wants explicit control over which team is active for racing

---

## the agent's Discretion

- Form field labels and placeholder text styling
- Toast notification visual styling (matching existing patterns)
- List item visual design (card vs row detail level)
- Expandable animation and interaction details
- Radio button visual styling for class selection

## Deferred Ideas

None — discussion stayed within phase scope