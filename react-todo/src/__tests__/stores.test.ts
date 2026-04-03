import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTaskStore } from '../stores/useTaskStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { usePriorityStore } from '../stores/usePriorityStore';
import { apiClient } from '../lib/apiClient';

vi.mock('../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('Store Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskStore.setState({
      tasks: [],
      isLoading: false,
      error: null,
    });
    useCategoryStore.setState({
      categories: [],
      isLoading: false,
      error: null,
    });
    usePriorityStore.setState({
      priorities: [],
      isLoading: false,
      error: null,
    });
  });

  describe('useTaskStore (TASK-01..05, INF-04, INF-05)', () => {
    const mockTask = {
      id: 'task-1',
      taskName: 'Test Task',
      taskSort: 0,
      createdDt: '2026-04-03T00:00:00Z',
      dueDt: null,
      isCompleted: false,
      isArchived: false,
      todoCategoryId: 'cat-1',
      todoPriorityId: 'pri-1',
      syncDt: '2026-04-03T00:00:00Z',
    };

    it('fetchTasks loads tasks from API (TASK-01)', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: [mockTask] });
      await useTaskStore.getState().fetchTasks();
      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].taskName).toBe('Test Task');
    });

    it('createTask adds task to store (TASK-02)', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockTask });
      await useTaskStore.getState().createTask({ taskName: 'Test Task' });
      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].id).toBe('task-1');
    });

    it('updateTask modifies existing task (TASK-03)', async () => {
      useTaskStore.setState({ tasks: [mockTask] });
      const updated = { ...mockTask, taskName: 'Updated Task' };
      mockApiClient.put.mockResolvedValueOnce({ data: updated });
      await useTaskStore.getState().updateTask({ id: 'task-1', taskName: 'Updated Task' });
      const state = useTaskStore.getState();
      expect(state.tasks[0].taskName).toBe('Updated Task');
    });

    it('deleteTask removes task from store (TASK-04)', async () => {
      useTaskStore.setState({ tasks: [mockTask] });
      mockApiClient.delete.mockResolvedValueOnce({});
      await useTaskStore.getState().deleteTask('task-1');
      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(0);
    });

    it('toggleTaskCompletion flips isCompleted (TASK-05)', async () => {
      useTaskStore.setState({ tasks: [mockTask] });
      const toggled = { ...mockTask, isCompleted: true };
      mockApiClient.put.mockResolvedValueOnce({ data: toggled });
      await useTaskStore.getState().toggleTaskCompletion('task-1');
      const state = useTaskStore.getState();
      expect(state.tasks[0].isCompleted).toBe(true);
    });

    it('sets isLoading during API calls (INF-04)', async () => {
      mockApiClient.get.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 50))
      );
      useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().isLoading).toBe(true);
      await new Promise((r) => setTimeout(r, 100));
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('sets error on API failure (INF-05)', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));
      await useTaskStore.getState().fetchTasks();
      const state = useTaskStore.getState();
      expect(state.error).toBe('Network error');
    });

    it('clearError resets error state', () => {
      useTaskStore.setState({ error: 'Some error' });
      useTaskStore.getState().clearError();
      expect(useTaskStore.getState().error).toBeNull();
    });
  });

  describe('useCategoryStore (CAT-01..03, INF-04, INF-05)', () => {
    const mockCategory = {
      id: 'cat-1',
      categoryName: 'Work',
      categorySort: 0,
      syncDt: null,
      tag: null,
    };

    it('createCategory adds category (CAT-01)', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockCategory });
      await useCategoryStore.getState().createCategory({ categoryName: 'Work' });
      const state = useCategoryStore.getState();
      expect(state.categories).toHaveLength(1);
      expect(state.categories[0].categoryName).toBe('Work');
    });

    it('updateCategory modifies existing category (CAT-02)', async () => {
      useCategoryStore.setState({ categories: [mockCategory] });
      const updated = { ...mockCategory, categoryName: 'Personal' };
      mockApiClient.put.mockResolvedValueOnce({ data: updated });
      await useCategoryStore.getState().updateCategory({ id: 'cat-1', categoryName: 'Personal' });
      expect(useCategoryStore.getState().categories[0].categoryName).toBe('Personal');
    });

    it('deleteCategory removes category (CAT-03)', async () => {
      useCategoryStore.setState({ categories: [mockCategory] });
      mockApiClient.delete.mockResolvedValueOnce({});
      await useCategoryStore.getState().deleteCategory('cat-1');
      expect(useCategoryStore.getState().categories).toHaveLength(0);
    });

    it('sets error on API failure (INF-05)', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Failed to fetch'));
      await useCategoryStore.getState().fetchCategories();
      expect(useCategoryStore.getState().error).toBe('Failed to fetch');
    });
  });

  describe('usePriorityStore (PRI-01..03, INF-04, INF-05)', () => {
    const mockPriority = {
      id: 'pri-1',
      priorityName: 'High',
      prioritySort: 0,
      syncDt: null,
      tag: null,
    };

    it('createPriority adds priority (PRI-01)', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockPriority });
      await usePriorityStore.getState().createPriority({ priorityName: 'High' });
      const state = usePriorityStore.getState();
      expect(state.priorities).toHaveLength(1);
      expect(state.priorities[0].priorityName).toBe('High');
    });

    it('updatePriority modifies existing priority (PRI-02)', async () => {
      usePriorityStore.setState({ priorities: [mockPriority] });
      const updated = { ...mockPriority, priorityName: 'Urgent' };
      mockApiClient.put.mockResolvedValueOnce({ data: updated });
      await usePriorityStore.getState().updatePriority({ id: 'pri-1', priorityName: 'Urgent' });
      expect(usePriorityStore.getState().priorities[0].priorityName).toBe('Urgent');
    });

    it('deletePriority removes priority (PRI-03)', async () => {
      usePriorityStore.setState({ priorities: [mockPriority] });
      mockApiClient.delete.mockResolvedValueOnce({});
      await usePriorityStore.getState().deletePriority('pri-1');
      expect(usePriorityStore.getState().priorities).toHaveLength(0);
    });

    it('sets error on API failure (INF-05)', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Failed to fetch'));
      await usePriorityStore.getState().fetchPriorities();
      expect(usePriorityStore.getState().error).toBe('Failed to fetch');
    });
  });
});
