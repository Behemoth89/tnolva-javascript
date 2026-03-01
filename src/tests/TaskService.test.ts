import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from '../bll/services/TaskService.js';
import type { IUnitOfWork } from '../interfaces/IUnitOfWork.js';
import type { ITaskRepository } from '../interfaces/ITaskRepository.js';
import type { ITask } from '../interfaces/ITask.js';
import { EStatus } from '../enums/EStatus.js';
import { EPriority } from '../enums/EPriority.js';

// Mock UnitOfWork
const createMockUnitOfWork = (taskRepo: Partial<ITaskRepository>): IUnitOfWork => {
  return {
    getTaskRepository: () => taskRepo as ITaskRepository,
    getCategoryRepository: vi.fn(),
    getRecurrenceTemplateRepository: vi.fn() as any,
    initialize: vi.fn(),
    completeTaskWithRecurrence: vi.fn(),
    assignTaskToCategory: vi.fn(),
    removeTaskFromCategory: vi.fn(),
    registerNew: vi.fn(),
    registerModified: vi.fn(),
    registerDeleted: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn(),
  };
};

describe('TaskService', () => {
  let mockTasks: ITask[];
  let taskRepository: ITaskRepository;
  let taskService: TaskService;
  let mockUnitOfWork: IUnitOfWork;

  beforeEach(() => {
    mockTasks = [
      {
        id: 'task-1',
        title: 'Test Task 1',
        description: 'Description 1',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        tags: ['tag1'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'task-2',
        title: 'Test Task 2',
        status: EStatus.IN_PROGRESS,
        priority: EPriority.HIGH,
        tags: [],
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    taskRepository = {
      getAll: vi.fn().mockReturnValue([...mockTasks]),
      getById: vi.fn().mockImplementation((id: string) => {
        return mockTasks.find(t => t.id === id) || null;
      }),
      find: vi.fn(),
      query: vi.fn(),
      getAllAsync: vi.fn().mockResolvedValue([...mockTasks]),
      getByIdAsync: vi.fn().mockImplementation((id: string) => {
        const task = mockTasks.find(t => t.id === id);
        return Promise.resolve(task || null);
      }),
      createAsync: vi.fn().mockImplementation((task: ITask) => {
        mockTasks.push(task);
        return Promise.resolve(task);
      }),
      updateAsync: vi.fn().mockImplementation((id: string, task: ITask) => {
        const index = mockTasks.findIndex(t => t.id === id);
        if (index !== -1) {
          mockTasks[index] = task;
          return Promise.resolve(task);
        }
        return Promise.resolve(null);
      }),
      deleteAsync: vi.fn().mockImplementation((id: string) => {
        const index = mockTasks.findIndex(t => t.id === id);
        if (index !== -1) {
          mockTasks.splice(index, 1);
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      }),
      getByStatus: vi.fn().mockImplementation((status: EStatus) => {
        return mockTasks.filter(t => t.status === status);
      }),
      getByPriority: vi.fn().mockImplementation((priority: EPriority) => {
        return mockTasks.filter(t => t.priority === priority);
      }),
      getByStatusAsync: vi.fn().mockImplementation((status: EStatus) => {
        return Promise.resolve(mockTasks.filter(t => t.status === status));
      }),
      getByPriorityAsync: vi.fn().mockImplementation((priority: EPriority) => {
        return Promise.resolve(mockTasks.filter(t => t.priority === priority));
      }),
    } as unknown as ITaskRepository;

    mockUnitOfWork = createMockUnitOfWork(taskRepository);
    taskService = new TaskService(mockUnitOfWork);
  });

  describe('createAsync', () => {
    it('should create a task with valid data', async () => {
      const dto = {
        id: 'new-task',
        title: 'New Task',
        description: 'New Description',
        priority: EPriority.HIGH,
        tags: ['new-tag'],
      };

      const result = await taskService.createAsync(dto);

      expect(result.id).toBe('new-task');
      expect(result.title).toBe('New Task');
      expect(result.description).toBe('New Description');
      expect(result.status).toBe(EStatus.TODO);
      expect(result.priority).toBe(EPriority.HIGH);
      expect(result.tags).toContain('new-tag');
      // Verify UOW change tracking is used
      expect(mockUnitOfWork.registerNew).toHaveBeenCalled();
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
    });

    it('should create task with default values', async () => {
      const dto = {
        id: 'minimal-task',
        title: 'Minimal Task',
      };

      const result = await taskService.createAsync(dto);

      expect(result.status).toBe(EStatus.TODO);
      expect(result.priority).toBe(EPriority.MEDIUM);
      expect(result.tags).toEqual([]);
    });

    it('should throw error for empty title', async () => {
      const dto = {
        id: 'empty-title',
        title: '   ',
      };

      await expect(taskService.createAsync(dto)).rejects.toThrow('Task title is required');
    });
  });

  describe('updateAsync', () => {
    it('should update task title', async () => {
      const dto = { title: 'Updated Title' };

      const result = await taskService.updateAsync('task-1', dto);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Updated Title');
    });

    it('should return null for non-existent task', async () => {
      const dto = { title: 'Updated' };

      const result = await taskService.updateAsync('non-existent', dto);

      expect(result).toBeNull();
    });

    it('should throw error for empty title', async () => {
      const dto = { title: '' };

      await expect(taskService.updateAsync('task-1', dto)).rejects.toThrow('Task title cannot be empty');
    });
  });

  describe('deleteAsync', () => {
    it('should delete existing task', async () => {
      const result = await taskService.deleteAsync('task-1');

      expect(result).toBe(true);
      // Verify UOW change tracking is used
      expect(mockUnitOfWork.registerDeleted).toHaveBeenCalled();
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
    });

    it('should return false for non-existent task', async () => {
      const result = await taskService.deleteAsync('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('startAsync', () => {
    it('should start a TODO task', async () => {
      const result = await taskService.startAsync('task-1');

      expect(result).not.toBeNull();
      expect(result?.status).toBe(EStatus.IN_PROGRESS);
    });

    it('should return null for non-TODO task', async () => {
      const result = await taskService.startAsync('task-2');

      expect(result).toBeNull();
    });
  });

  describe('completeAsync', () => {
    it('should complete an IN_PROGRESS task', async () => {
      const result = await taskService.completeAsync('task-2');

      expect(result).not.toBeNull();
      expect(result?.status).toBe(EStatus.DONE);
    });

    it('should return null for non-IN_PROGRESS task', async () => {
      const result = await taskService.completeAsync('task-1');

      expect(result).toBeNull();
    });
  });

  describe('cancelAsync', () => {
    it('should cancel any task', async () => {
      const result = await taskService.cancelAsync('task-1');

      expect(result).not.toBeNull();
      expect(result?.status).toBe(EStatus.CANCELLED);
    });
  });

  describe('addTagAsync', () => {
    it('should add a new tag', async () => {
      const result = await taskService.addTagAsync('task-1', 'new-tag');

      expect(result).not.toBeNull();
      expect(result?.tags).toContain('new-tag');
    });

    it('should not add duplicate tag', async () => {
      const result = await taskService.addTagAsync('task-1', 'tag1');

      expect(result?.tags?.filter(t => t === 'tag1').length).toBe(1);
    });

    it('should not add empty tag', async () => {
      const result = await taskService.addTagAsync('task-1', '   ');

      expect(result?.tags).toEqual(['tag1']);
    });
  });

  describe('removeTagAsync', () => {
    it('should remove existing tag', async () => {
      const result = await taskService.removeTagAsync('task-1', 'tag1');

      expect(result).not.toBeNull();
      expect(result?.tags).not.toContain('tag1');
    });

    it('should return task unchanged if tag does not exist', async () => {
      const result = await taskService.removeTagAsync('task-1', 'non-existent');

      expect(result).not.toBeNull();
      expect(result?.tags).toEqual(['tag1']);
    });
  });

  describe('changePriorityAsync', () => {
    it('should change task priority', async () => {
      const result = await taskService.changePriorityAsync('task-1', EPriority.LOW);

      expect(result).not.toBeNull();
      expect(result?.priority).toBe(EPriority.LOW);
    });
  });

  describe('getByStatusAsync', () => {
    it('should return tasks by status', async () => {
      const result = await taskService.getByStatusAsync(EStatus.TODO);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('task-1');
    });
  });

  describe('getByPriorityAsync', () => {
    it('should return tasks by priority', async () => {
      const result = await taskService.getByPriorityAsync(EPriority.HIGH);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('task-2');
    });
  });
});
