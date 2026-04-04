# Phase 4: Settings & Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 04-settings-integration
**Areas discussed:** Sidebar filtering behavior, Priority icon design, Empty state approach, State management for filtering, Due date filtering, Navbar navigation, Completed task filtering

---

## Sidebar Filtering Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Single-select only | Click one category at a time | |
| Multi-select with checkboxes | Select multiple categories simultaneously | ✓ |
| Single-select + "All" toggle | Default shows all, click filters to one | |

**User's choice:** Multi-select with checkboxes
**Notes:** User wants to filter by multiple categories simultaneously.

| Option | Description | Selected |
|--------|-------------|----------|
| Always show "All Tasks" and "Uncategorized" | "All Tasks" at top resets filter, "Uncategorized" at bottom | ✓ |
| Only "All Tasks" reset button | Just a way to clear the filter | |
| No special options, just categories | Click category to filter, click again to deselect | |

**User's choice:** Always show "All Tasks" and "Uncategorized"

| Option | Description | Selected |
|--------|-------------|----------|
| Show count next to each | Display task count per category like "Work (5)" | ✓ |
| No counts, just names | Cleaner, minimal | |

**User's choice:** Show count next to each category

| Option | Description | Selected |
|--------|-------------|----------|
| Highlight selected row | Selected categories get amber-500 text/background highlight | ✓ |
| Checkbox indicator only | Just checked/unchecked state | |
| Both checkbox and highlight | Checkbox shows selection, row also highlights | |

**User's choice:** Highlight selected row

| Option | Description | Selected |
|--------|-------------|----------|
| Fetch on DashboardPage mount | DashboardPage calls fetchCategories() in useEffect | ✓ |
| Fetch in Sidebar component itself | Sidebar handles its own data fetching | |

**User's choice:** Fetch on DashboardPage mount

---

## Priority Icon Design

| Option | Description | Selected |
|--------|-------------|----------|
| Replace text with icon only | Show only a flag icon, color-coded | |
| Icon + text together | Show both icon and priority name | |
| Icon with text on hover | Show icon by default, reveal name on hover via tooltip | ✓ |

**User's choice:** Icon with text on hover

| Option | Description | Selected |
|--------|-------------|----------|
| Flag icons, color by priority | FlagIcon from @heroicons/react, color-coded by priority level | ✓ |
| Exclamation/triangle icons | ExclamationTriangleIcon | |
| Number badges with colors | 1, 2, 3 in colored circles | |

**User's choice:** Flag icons, color by priority

| Option | Description | Selected |
|--------|-------------|----------|
| Map by prioritySort order | Use API prioritySort field — lowest sort = red, middle = amber, highest = green | ✓ |
| Map by priority name keywords | Check if name contains "high", "urgent", etc. | |
| Fixed 3-color scheme by position | First = red, second = amber, third = green | |

**User's choice:** Map by prioritySort order

---

## Empty State Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Create reusable EmptyState component | Single component used across all views | ✓ |
| Keep inline text in each component | Each component handles its own empty state | |
| Inline text + shared styles constant | Extract common styles to shared constant | |

**User's choice:** Create reusable EmptyState component

| Option | Description | Selected |
|--------|-------------|----------|
| Icon + title + subtitle | Visual icon, brief title, optional subtitle | ✓ |
| Simple text only | Just centered text | |
| Illustration + text | Custom SVG illustration with text | |

**User's choice:** Icon + title + subtitle

---

## State Management for Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| In useTaskStore | Add selectedCategoryIds state to useTaskStore, persists across navigation | ✓ |
| Local DashboardPage state | useState in DashboardPage only, resets on navigation | |
| URL query params | Store in URL (?cats=1,3), shareable/bookmarkable | |

**User's choice:** In useTaskStore

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, use persist middleware | Filter selection survives page reloads | ✓ |
| No, reset on navigation | Filter is session-only | |

**User's choice:** Yes, use persist middleware

---

## Due Date Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Section in same sidebar | Add "Due Date" section below categories in sidebar | ✓ |
| Dropdown/select in navbar | Separate from sidebar, in task area header | |
| Tab-based filter above task list | Horizontal tabs above task list | |

**User's choice:** Section in same sidebar

| Option | Description | Selected |
|--------|-------------|----------|
| Single-select date range | Pick one date range at a time, can combine with category multi-select | ✓ |
| Multi-select date ranges too | Select multiple ranges simultaneously | |

**User's choice:** Single-select date range

| Option | Description | Selected |
|--------|-------------|----------|
| Same useTaskStore with persist | Store alongside category filters, both persist together | ✓ |
| Local state, no persistence | Date filter resets on navigation | |

**User's choice:** Same useTaskStore with persist

---

## Navbar Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Add Home link to Navbar | Home/Dashboard link with house icon from @heroicons/react | ✓ |
| Add Home to sidebar instead | Home button in sidebar area of DashboardPage | |
| Both Navbar and sidebar | Home link in both places | |

**User's choice:** Add Home link to Navbar
**Notes:** User reported: "Navbar is missing home button, can't navigate back to dashboard from settings etc."

---

## Completed Task Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Checkbox in sidebar | "Show completed" checkbox toggle in sidebar section | ✓ |
| Tab or button above task list | Toggle button or tab above tasks | |
| Dropdown filter in sidebar | Dropdown with "Active", "Completed", "All" | |

**User's choice:** Checkbox in sidebar

| Option | Description | Selected |
|--------|-------------|----------|
| In useTaskStore with persist | Store showCompleted preference in useTaskStore | ✓ |
| Local state only | Store in DashboardPage local state | |

**User's choice:** In useTaskStore with persist

**User's requirements:**
- "Filter out completed tasks, by default only uncompleted tasks should be shown"
- "But there should be filter in sidebar to show also completed tasks"
- "Completed tasks should be sorted to the end, so even when looking all tasks, uncompleted tasks are shown on top and then completed ones, and after that whatever other sorting is used"

---

## the agent's Discretion

The following areas were left to the agent's discretion:
- Exact sidebar width and responsive behavior
- Specific date range labels and date calculation logic
- Exact EmptyState icon choices per scenario
- Priority color exact hex values (use Tailwind red-500, amber-500, green-500 or similar)
- Modal animation/transition approach

## Deferred Ideas

None — discussion stayed within phase scope.
