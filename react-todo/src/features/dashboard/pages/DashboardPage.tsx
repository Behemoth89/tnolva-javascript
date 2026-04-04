import { useEffect, useState } from 'react';
import { Navbar } from '../../../components/Navbar';
import { useTaskStore } from '../../../stores/useTaskStore';
import { useCategoryStore } from '../../../stores/useCategoryStore';
import { usePriorityStore } from '../../../stores/usePriorityStore';
import { TaskList } from '../components/TaskList';
import { TaskModal } from '../components/TaskModal';
import { Sidebar } from '../components/Sidebar';
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '../../../types/task';

export function DashboardPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const error = useTaskStore((state) => state.error);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const createTask = useTaskStore((state) => state.createTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const toggleTaskCompletion = useTaskStore((state) => state.toggleTaskCompletion);
  const clearError = useTaskStore((state) => state.clearError);

  const categories = useCategoryStore((state) => state.categories);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);

  const priorities = usePriorityStore((state) => state.priorities);
  const fetchPriorities = usePriorityStore((state) => state.fetchPriorities);

  const selectedCategoryIds = useTaskStore((state) => state.selectedCategoryIds);
  const selectedDateRange = useTaskStore((state) => state.selectedDateRange);
  const showCompleted = useTaskStore((state) => state.showCompleted);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // Fetch data on mount
  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchPriorities();
  }, [fetchTasks, fetchCategories, fetchPriorities]);

  const handleAddTask = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id);
    }
  };

  const handleToggleTask = async (id: string) => {
    await toggleTaskCompletion(id);
  };

  const handleSubmitTask = async (payload: CreateTaskPayload | UpdateTaskPayload) => {
    if ('id' in payload) {
      await updateTask(payload);
    } else {
      await createTask(payload);
    }
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

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
              tasks={tasks}
              categories={categories}
              priorities={priorities}
              onToggle={handleToggleTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              selectedCategoryIds={selectedCategoryIds}
              selectedDateRange={selectedDateRange}
              showCompleted={showCompleted}
            />
          )}

          {/* Task modal */}
          <TaskModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            onSubmit={handleSubmitTask}
            task={editingTask}
            categories={categories}
            priorities={priorities}
            isSubmitting={isLoading}
          />
        </main>
      </div>
    </div>
  );
}
