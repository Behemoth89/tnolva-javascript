import { useMemo } from 'react';
import { useTaskStore } from '../../../stores/useTaskStore';
import { TaskCard } from './TaskCard';
import { EmptyState } from '../../../components/EmptyState';
import { InboxIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface TaskListProps {
  selectedCategoryIds?: string[];
  selectedDateRange?: string | null;
  showCompleted?: boolean;
}

function isDateInRange(date: Date, range: string, now: Date, today: Date): boolean {
  if (!date) return range === 'no-date';

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  switch (range) {
    case 'today':
      return date >= today && date < tomorrow;
    case 'this-week': {
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return date >= monday && date <= sunday;
    }
    case 'next-week': {
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset + 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return date >= monday && date <= sunday;
    }
    case 'overdue':
      return date < today;
    case 'no-date':
      return false;
    default:
      return true;
  }
}

export function TaskList({
  selectedCategoryIds = [],
  selectedDateRange = null,
  showCompleted = false,
}: TaskListProps) {
  const tasks = useTaskStore((state) => state.tasks);
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Category filter: if categories selected, show tasks matching ANY selected category
    if (selectedCategoryIds.length > 0) {
      result = result.filter((task) => {
        // Handle "Uncategorized" special value
        if (selectedCategoryIds.includes('__uncategorized__')) {
          if (!task.todoCategoryId) return true;
        }
        // Normal category match
        if (selectedCategoryIds.includes(task.todoCategoryId)) return true;
        return false;
      });
    }

    // Show completed filter: hide completed by default
    if (!showCompleted) {
      result = result.filter((task) => !task.isCompleted);
    }

    // Due date filter
    if (selectedDateRange) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((task) => {
        if (!task.dueDt) {
          return selectedDateRange === 'no-date';
        }
        const dueDate = new Date(task.dueDt);
        return isDateInRange(dueDate, selectedDateRange, now, today);
      });
    }

    // Sort: completed tasks to bottom
    return [...result].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return 0;
    });
  }, [tasks, selectedCategoryIds, selectedDateRange, showCompleted]);

  // No tasks at all
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="No tasks yet"
        subtitle="Click 'Add Task' to create one"
      />
    );
  }

  // Tasks exist but filters returned nothing
  if (filteredTasks.length === 0) {
    return (
      <EmptyState
        icon={FunnelIcon}
        title="No tasks match your filters"
        subtitle="Try adjusting your category or date filters"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredTasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
