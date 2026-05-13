import { useTaskStore } from '../../../stores/useTaskStore';
import { useCategoryStore } from '../../../stores/useCategoryStore';

const UNCATEGORIZED_ID = '__uncategorized__';

const dateRanges = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this-week' },
  { label: 'Next Week', value: 'next-week' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'No Date', value: 'no-date' },
];

export function Sidebar() {
  const tasks = useTaskStore((state) => state.tasks);
  const selectedCategoryIds = useTaskStore((state) => state.selectedCategoryIds);
  const selectedDateRange = useTaskStore((state) => state.selectedDateRange);
  const showCompleted = useTaskStore((state) => state.showCompleted);
  const toggleCategoryId = useTaskStore((state) => state.toggleCategoryId);
  const clearCategoryFilter = useTaskStore((state) => state.clearCategoryFilter);
  const setSelectedDateRange = useTaskStore((state) => state.setSelectedDateRange);
  const toggleShowCompleted = useTaskStore((state) => state.toggleShowCompleted);

  const categories = useCategoryStore((state) => state.categories);
  const sortedCategories = [...categories].sort((a, b) => a.categorySort - b.categorySort);

  const isAllTasksActive = selectedCategoryIds.length === 0;
  const uncategorizedCount = tasks.filter((t) => !t.todoCategoryId).length;
  const isUncategorizedActive = selectedCategoryIds.includes(UNCATEGORIZED_ID);

  return (
    <aside className="w-64 bg-zinc-900 min-h-[calc(100vh-64px)] border-r border-zinc-800 p-4">
      {/* Section 1: Category Filtering */}
      <div className="border-b border-zinc-800 pb-4 mb-4">
        <h2 className="text-sm font-medium text-zinc-300 mb-3">Categories</h2>

        {/* All Tasks button */}
        <button
          type="button"
          onClick={clearCategoryFilter}
          className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
            isAllTasksActive
              ? 'bg-amber-500/10 text-amber-500'
              : 'text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          All Tasks ({tasks.length})
        </button>

        {/* Category checkboxes */}
        <div className="mt-2 space-y-1">
          {sortedCategories.map((category) => {
            const isSelected = selectedCategoryIds.includes(category.id);
            const taskCount = tasks.filter(
              (t) => t.todoCategoryId === category.id
            ).length;

            return (
              <label
                key={category.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategoryId(category.id)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                />
                <span className="flex-1 truncate">{category.categoryName}</span>
                <span className="text-xs text-zinc-500">{taskCount}</span>
              </label>
            );
          })}
        </div>

        {/* Uncategorized */}
        <label
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors mt-2 ${
            isUncategorizedActive
              ? 'bg-amber-500/10 text-amber-500'
              : 'text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <input
            type="checkbox"
            checked={isUncategorizedActive}
            onChange={() => toggleCategoryId(UNCATEGORIZED_ID)}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
          />
          <span className="flex-1 truncate">Uncategorized</span>
          <span className="text-xs text-zinc-500">{uncategorizedCount}</span>
        </label>
      </div>

      {/* Section 2: Due Date Filter */}
      <div className="border-b border-zinc-800 pb-4 mb-4">
        <h2 className="text-sm font-medium text-zinc-300 mb-3">Due Date</h2>
        <div className="flex flex-wrap gap-2">
          {dateRanges.map((range) => {
            const isSelected = selectedDateRange === range.value;

            return (
              <button
                key={range.value}
                type="button"
                onClick={() =>
                  setSelectedDateRange(isSelected ? null : range.value)
                }
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: Show Completed Toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={toggleShowCompleted}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
          />
          <span className="text-sm text-zinc-400">Show completed</span>
        </label>
      </div>
    </aside>
  );
}
