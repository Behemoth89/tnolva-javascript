import { FlagIcon } from '@heroicons/react/24/outline';
import type { Task } from '../../../types/task';
import type { Priority } from '../../../types/priority';
import { useTaskStore } from '../../../stores/useTaskStore';
import { useCategoryStore } from '../../../stores/useCategoryStore';
import { usePriorityStore } from '../../../stores/usePriorityStore';
import { useModalStore } from '../../../stores/useModalStore';

interface TaskCardProps {
  task: Task;
}

function getPriorityColor(priority: Priority, allPriorities: Priority[]): string {
  const sorted = [...allPriorities].sort((a, b) => a.prioritySort - b.prioritySort);
  const index = sorted.findIndex((p) => p.id === priority.id);
  if (index === 0) return 'text-red-500';
  if (index === sorted.length - 1) return 'text-green-500';
  return 'text-amber-500';
}

export function TaskCard({ task }: TaskCardProps) {
  const categories = useCategoryStore((state) => state.categories);
  const priorities = usePriorityStore((state) => state.priorities);
  const toggleTaskCompletion = useTaskStore((state) => state.toggleTaskCompletion);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const openModal = useModalStore((state) => state.openModal);

  const category = categories.find((c) => c.id === task.todoCategoryId);
  const priority = priorities.find((p) => p.id === task.todoPriorityId);

  const handleToggle = () => toggleTaskCompletion(task.id);

  const handleEdit = () => openModal(task);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            task.isCompleted
              ? 'bg-amber-500 border-amber-500'
              : 'border-amber-500 hover:bg-amber-500/10'
          }`}
          aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.isCompleted && (
            <svg className="h-3 w-3 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-zinc-100 ${
              task.isCompleted ? 'line-through opacity-60' : ''
            }`}
          >
            {task.taskName || 'Untitled task'}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Category badge */}
            {category && (
              <span className="inline-flex items-center rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                {category.categoryName}
              </span>
            )}
            {/* Priority icon */}
            {priority && (
              <span
                title={priority.priorityName}
                className="cursor-help inline-flex items-center"
              >
                <FlagIcon className={`h-5 w-5 ${getPriorityColor(priority, priorities)}`} />
              </span>
            )}
            {/* Due date */}
            {task.dueDt && (
              <span className="text-xs text-zinc-400">
                Due: {new Date(task.dueDt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleEdit}
            className="p-1.5 text-zinc-400 hover:text-amber-500 transition-colors rounded"
            aria-label="Edit task"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded"
            aria-label="Delete task"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
