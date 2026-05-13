# Phase 4: Settings & Integration - Research

**Researched:** 2026-04-04
**Status:** Complete
**Scope:** Sidebar filtering, priority icons, empty states, navigation, Zustand persist extensions

## Technical Approach

### Zustand Persist for Filter State

**Pattern:** Extend `useTaskStore` with `persist` middleware for filter state (selectedCategoryIds, selectedDateRange, showCompleted).

**Key insight:** This is a pure SPA (no SSR), so Zustand persist works without hydration issues. The `persist` middleware from `zustand/middleware` stores state in `localStorage` automatically.

**Recommended approach:**
```typescript
import { persist } from 'zustand/middleware';

// Wrap store with persist, but only persist filter fields (not tasks array)
export const useTaskStore = create(
  persist<TaskStore>(
    (set, get) => ({ ... }),
    {
      name: 'task-store', // localStorage key
      partialize: (state) => ({
        selectedCategoryIds: state.selectedCategoryIds,
        selectedDateRange: state.selectedDateRange,
        showCompleted: state.showCompleted,
      }),
    }
  )
);
```

**Why partialize:** Don't persist the entire tasks array — it should be fetched fresh on mount. Only persist filter preferences.

**Common pitfall:** If you don't use `partialize`, the entire store (including tasks) gets persisted, causing stale data on reload.

### Sidebar Category Filtering Logic

**Pattern:** Multi-select checkbox filtering with intersection logic.

**Filter logic:**
```typescript
const filteredTasks = tasks.filter((task) => {
  // Category filter: if no categories selected, show all
  if (selectedCategoryIds.length > 0) {
    if (!selectedCategoryIds.includes(task.todoCategoryId)) {
      return false;
    }
  }
  // Completed filter: hide completed by default
  if (!showCompleted && task.isCompleted) {
    return false;
  }
  // Due date filter: apply date range logic
  if (selectedDateRange) {
    // Date range calculation based on selected range
  }
  return true;
});

// Sort: uncompleted first, then completed
filteredTasks.sort((a, b) => {
  if (a.isCompleted !== b.isCompleted) {
    return a.isCompleted ? 1 : -1;
  }
  return 0; // Preserve existing sort order
});
```

### Priority Icon with Tooltip

**Pattern:** Replace text badge with `FlagIcon` from `@heroicons/react` + native `title` attribute for tooltip.

**Color mapping by prioritySort:**
- Sort order from API determines urgency
- Lowest sort value = most urgent = red-500
- Middle sort value = amber-500
- Highest sort value = green-500

**Implementation:**
```tsx
{priority && (
  <span title={priority.priorityName} className="cursor-help">
    <FlagIcon className="h-5 w-5" style={{ color: priorityColor }} />
  </span>
)}
```

**Why native `title` over custom tooltip:** Zero dependencies, accessible, works without additional libraries. Custom tooltips add bundle size for minimal benefit.

### EmptyState Component

**Pattern:** Reusable component with icon, title, subtitle.

**Structure:**
```tsx
interface EmptyStateProps {
  icon: React.ElementType; // Heroicon component
  title: string;
  subtitle?: string;
}
```

**Variants needed:**
1. No tasks: "No tasks yet" + "Click 'Add Task' to create one"
2. No categories: "No categories" + "Add categories in Settings"
3. No priorities: "No priorities" + "Add priorities in Settings"
4. Filtered empty: "No tasks in this category" (when filter returns no results)

### Due Date Filter Logic

**Pattern:** Single-select date range with predefined options.

**Date ranges:**
- "Today" — tasks due today
- "This Week" — tasks due this week (Monday-Sunday)
- "Next Week" — tasks due next week
- "Overdue" — tasks with due date in the past
- "No Date" — tasks with null/empty dueDt

**Date calculation:**
```typescript
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getWeekRange = (weekOffset = 0) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};
```

### Navbar Home Link

**Pattern:** Add `Link` with `HomeIcon` from `@heroicons/react` to Navbar.

**Implementation:**
```tsx
import { Link } from 'react-router';
import { HomeIcon } from '@heroicons/react/24/outline';

<Link to="/" className="text-zinc-400 hover:text-amber-500 transition-colors">
  <HomeIcon className="h-5 w-5" />
</Link>
```

## Don't Hand-Roll

| Pattern | Use Instead |
|---------|-------------|
| Custom tooltip library | Native `title` attribute — zero deps, accessible |
| Date picker library | Predefined date range buttons — simpler UX for this use case |
| Custom state persistence | Zustand `persist` middleware — battle-tested, 1KB |
| Custom filter dropdown | Checkbox list — matches D-01 multi-select decision |

## Common Pitfalls

1. **Stale persisted tasks:** Don't persist the tasks array — only persist filter preferences. Use `partialize` in persist config.
2. **Filter state not syncing:** Filter state must live in `useTaskStore` (global), not local component state, so Sidebar and TaskList share the same filters.
3. **Date timezone issues:** Use local date comparison, not UTC. The API returns ISO strings — convert to local Date objects before comparing.
4. **Category ID mismatch:** `todoCategoryId` on Task may be empty string or null — handle both cases for "Uncategorized" filter.
5. **Priority color mapping:** Don't hardcode colors to priority names — map by `prioritySort` order since names are user-defined.

## Validation Architecture

**Observable behaviors to verify:**
1. Sidebar renders with category checkboxes, date range buttons, show completed toggle
2. Selecting categories filters tasks to only those matching selected categories
3. Selecting multiple categories shows tasks matching ANY selected category (OR logic)
4. "All Tasks" resets category filter
5. "Uncategorized" shows tasks with no category assigned
6. Priority displays as colored icon, not text badge
7. Hovering priority icon shows priority name tooltip
8. EmptyState component renders when no tasks exist
9. EmptyState renders when category filter returns no results
10. "Show completed" toggle reveals hidden completed tasks
11. Completed tasks sort to bottom of list
12. Filter preferences persist across page reload
13. Navbar has Home link that navigates to dashboard
14. Due date range filter correctly filters tasks by due date
