# Phase 5: Race Participation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 5-Race Participation
**Areas discussed:** Scanner UI, Combined scanner+score view, Manual entry fallback, Live score refresh, Scan feedback, Pre-race state, Post-race summary

---

## Scanner UI

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen scanner modal | UI: Full-screen scanner modal, auto-shows camera on race page | ✓ |
| Inline scanner in view | UI: Inline scanner embedded within the race view | |
| Tap-to-scan button | UX: Scanner opens only when user taps scan button | |
| Auto-start camera | UX: Scanner activates automatically when race page loads | |

**User's choice:** Full-screen scanner modal
**Notes:** Camera auto-shows when modal opens — no separate tap-to-start step

---

## Combined scanner+score view

| Option | Description | Selected |
|--------|-------------|----------|
| Combined view | UX: User sees scanner and live score simultaneously on one screen | ✓ |
| Separate tabs | UX: User toggles between scanner and score sections | |
| Score overlay | UX: Score appears as overlay on top of scanner | |

**User's choice:** Combined view
**Notes:** Score panel visible at all times during active race; scanner fills remainder of screen

---

## Manual CP Entry (surfacing)

| Option | Description | Selected |
|--------|-------------|----------|
| Always shown | UX: User can always see the text input below camera | ✓ |
| On fallback button | UX: Secondary option revealed after camera fails or user taps a button | |
| Settings menu | UX: Accessible via a settings/menu in the race view | |

**User's choice:** Always shown

---

## Manual CP Entry (submission)

| Option | Description | Selected |
|--------|-------------|----------|
| Enter to submit | UX: Hitting Enter submits the code immediately | |
| Button required | UX: Separate submit button, Enter just types | ✓ |

**User's choice:** Button required

---

## Manual CP Entry (format guidance)

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-uppercase | UX: Text input auto-formats to uppercase as user types | |
| Case insensitive | UX: Case-insensitive parsing, no visual transformation | |
| Format hint | UX: Real-time validation showing what CP codes look like | ✓ |

**User's choice:** Format hint (placeholder with example CP code)

---

## Live Score Refresh (strategy)

| Option | Description | Selected |
|--------|-------------|----------|
| Polling (30s) | UX: Auto-refresh every 30 seconds, no user action needed | |
| Pull-to-refresh | UX: Manual pull-to-refresh, user controls when to update | |
| Manual button | UX: Refresh button always visible, user taps to update | ✓ |

**User's choice:** Manual button

---

## Live Score Refresh (button placement)

| Option | Description | Selected |
|--------|-------------|----------|
| Score header | UX: Refresh button in the score panel header, always visible | |
| Scanner FAB | UX: Refresh button on the scanner view as a floating action | |
| Both views | UX: Both score panel and scanner have their own refresh buttons | ✓ |

**User's choice:** Both views — refresh button on score header AND as FAB in scanner view

---

## Scan Feedback (method)

| Option | Description | Selected |
|--------|-------------|----------|
| Toast banners | UX: Color-coded banners (green success, red error) with message | ✓ |
| Full-screen overlay | UX: Scanner pauses and shows full-screen result overlay | |
| Score pulse | UX: Score panel animates/flashes to draw attention | |

**User's choice:** Toast banners with color coding

---

## Scan Feedback (toast timing)

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-dismiss 3s | UX: Toast auto-dismisses after 3 seconds | |
| Manual dismiss | UX: Toast stays until user taps to dismiss | |
| User preference | UX: User chooses via a setting toggle | ✓ |

**User's choice:** User preference setting — toggle between 3s auto-dismiss and manual dismiss

---

## Pre-Race State

| Option | Description | Selected |
|--------|-------------|----------|
| Scan START prompt | UX: Minimal — large prominent 'Scan START to begin' message | |
| Team info card | UX: Shows team name, class, and registered members | |
| Team + scanner preview | UX: Team info + scanner preview so they're ready to scan | ✓ |

**User's choice:** Team info card + scanner preview shown together before START scan

---

## Post-Race Summary (content)

| Option | Description | Selected |
|--------|-------------|----------|
| Detailed breakdown | UX: Full breakdown — score, bonus, penalty, final score, elapsed time | ✓ |
| Score + position only | UX: Final score and class position only, clean and simple | |
| Score + position + results link | UX: Score + position + 'View results' button linking to contest results page | |

**User's choice:** Detailed breakdown — score, bonus, penalty, final score, and elapsed time

---

## Post-Race Summary (layout)

| Option | Description | Selected |
|--------|-------------|----------|
| Scrollable breakdown | UX: Show breakdown first, with 'Back to contest' button at bottom | |
| Tabbed layout | UX: Tabbed interface — one tab for score, another for markings history | |
| Collapsible cards | UX: Clean card-based layout with score as hero, breakdown in expandable sections | ✓ |

**User's choice:** Collapsible cards — score as hero, breakdown sections below that expand/collapse

---

## Agent's Discretion

[No "you decide" moments — user made explicit choices for all areas]

## Deferred Ideas

[No deferred ideas — discussion stayed within phase scope]