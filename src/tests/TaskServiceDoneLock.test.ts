import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskService } from '../../src/bll/services/TaskService.js';
import type { IUnitOfWork } from '../../src/interfaces/IUnitOfWork.js';
import type { ITask } from '../../src/interfaces/ITask.js';
import { EStatus } from '../../src/enums/EStatus.js';

describe('TaskService - Done Lock Behavior', () => {
  let mockUnitOfWork: any;
  let mockTaskRepository: any;
  let taskService: TaskService;

  const createMockTask = (overrides: Partial<ITask> = {}): ITask => ({
    id: 'task-1',
    title: 'Test Task',
    status: EStatus.TODO,
    priority: 'MEDIUM' as any,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    mockTaskRepository = {
      getByIdAsync: vi.fn(),
      getAllAsync: vi.fn(),
      getByStatusAsync: vi.fn(),
      getByPriorityAsync: vi.fn(),
      createAsync: vi.fn(),
      updateAsync: vi.fn(),
      deleteAsync: vi.fn(),
    };

    mockUnitOfWork = {
      getTaskRepository: () => mockTaskRepository,
      getRecurringTaskRepository: vi.fn().mockReturnValue({
        getAllAsync: vi.fn(),
        getByIdAsync: vi.fn(),
      }),
      getTaskRecurringLinkRepository: vi.fn().mockReturnValue({
        getByTaskIdAsync: vi.fn().mockResolvedValue([]),
      }),
      registerNew: vi.fn(),
      registerModified: vi.fn(),
      registerDeleted: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn(),
    };

    taskService = new TaskService(mockUnitOfWork as IUnitOfWork);
  });

  describe('updateAsync - done lock', () => {
    it('should throw error when attempting to update a DONE task', async () => {
      const doneTask = createMockTask({ status: EStatus.DONE });
      mockTaskRepository.getByIdAsync.mockResolvedValue(doneTask);

      await expect(
        taskService.updateAsync('task-1', { title: 'Updated Title' })
      ).rejects.toThrow('Cannot modify completed task');
    });

    it('should allow updating TODO task', async () => {
      const todoTask = createMockTask({ status: EStatus.TODO });
      mockTaskRepository.getByIdAsync.mockResolvedValue(todoTask);
      mockTaskRepository.updateAsync.mockResolvedValue({
        ...todoTask,
        title: 'Updated Title',
      });

      const result = await taskService.updateAsync('task-1', { title: 'Updated Title' });

      expect(result).toBeDefined();
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
    });

    it('should allow updating IN_PROGRESS task', async () => {
      const inProgressTask = createMockTask({ status: EStatus.IN_PROGRESS });
      mockTaskRepository.getByIdAsync.mockResolvedValue(inProgressTask);
      mockTaskRepository.updateAsync.mockResolvedValue({
        ...inProgressTask,
        title: 'Updated Title',
      });

      const result = await taskService.updateAsync('task-1', { title: 'Updated Title' });

      expect(result).toBeDefined();
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
    });

    it('should return null when task not found', async () => {
      mockTaskRepository.getByIdAsync.mockResolvedValue(null);

      const result = await taskService.updateAsync('non-existent', { title: 'Updated' });

      expect(result).toBeNull();
    });
  });

  describe('deleteAsync - done lock', () => {
    it('should throw error when attempting to delete a DONE task', async () => {
      const doneTask = createMockTask({ status: EStatus.DONE });
      mockTaskRepository.getByIdAsync.mockResolvedValue(doneTask);

      await expect(taskService.deleteAsync('task-1')).rejects.toThrow(
        'Cannot delete completed task'
      );
    });

    it('should allow deleting TODO task', async () => {
      const todoTask = createMockTask({ status: EStatus.TODO });
      mockTaskRepository.getByIdAsync.mockResolvedValue(todoTask);
      mockTaskRepository.deleteAsync.mockResolvedValue(true);

      const result = await taskService.deleteAsync('task-1');

      expect(result).toBe(true);
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
    });

    it('should allow deleting IN_PROGRESS task', async () => {
      const inProgressTask = createMockTask({ status: EStatus.IN_PROGRESS });
      mockTaskRepository.getByIdAsync.mockResolvedValue(inProgressTask);
      mockTaskRepository.deleteAsync.mockResolvedValue(true);

      const result = await taskService.deleteAsync('task-1');

      expect(result).toBe(true);
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
    });

    it('should return false when task not found', async () => {
      mockTaskRepository.getByIdAsync.mockResolvedValue(null);

      const result = await taskService.deleteAsync('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('isLinkedToRecurringTask', () => {
    it('should return true when task has a recurring link', async () => {
      const mockLinkRepo = {
        getByTaskIdAsync: vi.fn().mockResolvedValue([
          { recurringTaskId: 'recurring-1', taskId: 'task-1' },
        ]),
      };
      mockUnitOfWork.getTaskRecurringLinkRepository.mockReturnValue(mockLinkRepo);

      const result = await taskService.isLinkedToRecurringTask('task-1');

      expect(result).toBe(true);
    });

    it('should return false when task has no recurring link', async () => {
      const mockLinkRepo = {
        getByTaskIdAsync: vi.fn().mockResolvedValue([]),
      };
      mockUnitOfWork.getTaskRecurringLinkRepository.mockReturnValue(mockLinkRepo);

      const result = await taskService.isLinkedToRecurringTask('task-1');

      expect(result).toBe(false);
    });

    it('should return false when repository not available', async () => {
      mockUnitOfWork.getTaskRecurringLinkRepository.mockReturnValue(undefined);

      const result = await taskService.isLinkedToRecurringTask('task-1');

      expect(result).toBe(false);
    });
  });

  describe('getLinkedRecurringTaskId', () => {
    it('should return recurring task ID when linked', async () => {
      const mockLinkRepo = {
        getByTaskIdAsync: vi.fn().mockResolvedValue([
          { recurringTaskId: 'recurring-1', taskId: 'task-1' },
        ]),
      };
      mockUnitOfWork.getTaskRecurringLinkRepository.mockReturnValue(mockLinkRepo);

      const result = await taskService.getLinkedRecurringTaskId('task-1');

      expect(result).toBe('recurring-1');
    });

    it('should return null when not linked', async () => {
      const mockLinkRepo = {
        getByTaskIdAsync: vi.fn().mockResolvedValue([]),
      };
      mockUnitOfWork.getTaskRecurringLinkRepository.mockReturnValue(mockLinkRepo);

      const result = await taskService.getLinkedRecurringTaskId('task-1');

      expect(result).toBeNull();
    });

    it('should return null when repository not available', async () => {
      mockUnitOfWork.getTaskRecurringLinkRepository.mockReturnValue(undefined);

      const result = await taskService.getLinkedRecurringTaskId('task-1');

      expect(result).toBeNull();
    });
  });
});
