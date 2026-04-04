import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../lib/apiClient';
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '../types/task';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  // Filter state (persisted)
  selectedCategoryIds: string[];
  selectedDateRange: string | null;
  showCompleted: boolean;
  // Filter actions
  setSelectedCategoryIds: (ids: string[]) => void;
  toggleCategoryId: (id: string) => void;
  clearCategoryFilter: () => void;
  setSelectedDateRange: (range: string | null) => void;
  toggleShowCompleted: () => void;
  // Task CRUD actions
  fetchTasks: () => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<void>;
  updateTask: (payload: UpdateTaskPayload) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,

      // Filter state defaults
      selectedCategoryIds: [],
      selectedDateRange: null,
      showCompleted: false,

      // Filter actions
      setSelectedCategoryIds: (ids: string[]) => set({ selectedCategoryIds: ids }),

      toggleCategoryId: (id: string) => {
        const current = get().selectedCategoryIds;
        const updated = current.includes(id)
          ? current.filter((cid) => cid !== id)
          : [...current, id];
        set({ selectedCategoryIds: updated });
      },

      clearCategoryFilter: () => set({ selectedCategoryIds: [] }),

      setSelectedDateRange: (range: string | null) => set({ selectedDateRange: range }),

      toggleShowCompleted: () => set((state) => ({ showCompleted: !state.showCompleted })),

      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get<Task[]>('/TodoTasks');
          set({ tasks: response.data, isLoading: false });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
          set({ error: message, isLoading: false });
        }
      },

      createTask: async (payload: CreateTaskPayload) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<Task>('/TodoTasks', payload);
          set((state) => ({
            tasks: [response.data, ...state.tasks],
            isLoading: false,
          }));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to create task';
          set({ error: message, isLoading: false });
        }
      },

      updateTask: async (payload: UpdateTaskPayload) => {
        set({ isLoading: true, error: null });
        try {
          const existing = get().tasks.find((t) => t.id === payload.id);
          if (!existing) {
            set({ error: 'Task not found', isLoading: false });
            return;
          }
          const updated = {
            ...existing,
            ...payload,
          };
          const response = await apiClient.put<Task>(`/TodoTasks/${payload.id}`, updated);
          set((state) => ({
            tasks: state.tasks.map((task) => (task.id === payload.id ? response.data : task)),
            isLoading: false,
          }));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to update task';
          set({ error: message, isLoading: false });
        }
      },

      deleteTask: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.delete(`/TodoTasks/${id}`);
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
            isLoading: false,
          }));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to delete task';
          set({ error: message, isLoading: false });
        }
      },

      toggleTaskCompletion: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const task = get().tasks.find((t) => t.id === id);
          if (!task) {
            set({ error: 'Task not found', isLoading: false });
            return;
          }
          const updated = {
            ...task,
            isCompleted: !task.isCompleted,
          };
          const response = await apiClient.put<Task>(`/TodoTasks/${id}`, updated);
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? response.data : t)),
            isLoading: false,
          }));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to toggle task completion';
          set({ error: message, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'task-filter-state',
      partialize: (state) => ({
        selectedCategoryIds: state.selectedCategoryIds,
        selectedDateRange: state.selectedDateRange,
        showCompleted: state.showCompleted,
      }),
    }
  )
);
