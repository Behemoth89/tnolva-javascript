import { useEffect } from 'react';
import { Navbar } from '../../../components/Navbar';
import { useTaskStore } from '../../../stores/useTaskStore';
import { useCategoryStore } from '../../../stores/useCategoryStore';
import { usePriorityStore } from '../../../stores/usePriorityStore';
import { useModalStore } from '../../../stores/useModalStore';
import { TaskList } from '../components/TaskList';
import { TaskModal } from '../components/TaskModal';
import { Sidebar } from '../components/Sidebar';

export function DashboardPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const error = useTaskStore((state) => state.error);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const clearError = useTaskStore((state) => state.clearError);

  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const fetchPriorities = usePriorityStore((state) => state.fetchPriorities);

  const selectedCategoryIds = useTaskStore((state) => state.selectedCategoryIds);
  const selectedDateRange = useTaskStore((state) => state.selectedDateRange);
  const showCompleted = useTaskStore((state) => state.showCompleted);

  const openModal = useModalStore((state) => state.openModal);

  // Fetch data on mount
  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchPriorities();
  }, [fetchTasks, fetchCategories, fetchPriorities]);

  const handleAddTask = () => openModal();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-zinc-100">Tasks</h1>
            <button
              type="button"
              onClick={handleAddTask}
              className="bg-amber-500 text-zinc-900 font-medium px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
            >
              Add Task
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg px-4 py-3 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={clearError}
                className="text-red-500 hover:text-red-400 ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Loading spinner */}
          {isLoading && tasks.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <TaskList
              selectedCategoryIds={selectedCategoryIds}
              selectedDateRange={selectedDateRange}
              showCompleted={showCompleted}
            />
          )}

          {/* Task modal */}
          <TaskModal />
        </main>
      </div>
    </div>
  );
}
