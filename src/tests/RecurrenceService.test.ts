import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecurrenceService } from '../bll/services/RecurrenceService.js';
import type { IRecurrenceService } from '../bll/interfaces/IRecurrenceService.js';
import type { IUnitOfWork } from '../interfaces/IUnitOfWork.js';
import type { ITaskRepository } from '../interfaces/ITaskRepository.js';
import type { IRecurrenceTemplateRepository } from '../interfaces/IRecurrenceTemplateRepository.js';
import type { ITask } from '../interfaces/ITask.js';
import type { IRecurrenceTemplate } from '../interfaces/IRecurrenceTemplate.js';
import { EStatus, EPriority } from '../enums/index.js';

describe('RecurrenceService', () => {
  let recurrenceService: IRecurrenceService;
  let mockRecurrenceTemplateRepository: IRecurrenceTemplateRepository;
  let mockTaskRepository: ITaskRepository;
  let mockUnitOfWork: IUnitOfWork;

  const mockTemplates: IRecurrenceTemplate[] = [
    {
      id: 'template-1',
      name: 'Daily',
      intervals: [{ unit: 'days', value: 1 }],
    },
    {
      id: 'template-2',
      name: 'Weekly',
      intervals: [{ unit: 'weeks', value: 1 }],
    },
  ];

  beforeEach(() => {
    mockRecurrenceTemplateRepository = {
      initialize: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn().mockReturnValue([...mockTemplates]),
      getById: vi.fn().mockImplementation((id: string) => {
        return mockTemplates.find(t => t.id === id) || null;
      }),
      find: vi.fn(),
      query: vi.fn(),
      getAllAsync: vi.fn().mockResolvedValue([...mockTemplates]),
      getByIdAsync: vi.fn().mockImplementation((id: string) => {
        return Promise.resolve(mockTemplates.find(t => t.id === id) || null);
      }),
      createAsync: vi.fn().mockImplementation((template: IRecurrenceTemplate) => {
        mockTemplates.push(template);
        return Promise.resolve(template);
      }),
      updateAsync: vi.fn(),
      deleteAsync: vi.fn().mockResolvedValue(true),
      createBatchAsync: vi.fn().mockResolvedValue([]),
      deleteBatchAsync: vi.fn().mockResolvedValue(true),
      existsAsync: vi.fn().mockImplementation((id: string) => {
        return Promise.resolve(mockTemplates.some(t => t.id === id));
      }),
    } as unknown as IRecurrenceTemplateRepository;

    mockTaskRepository = {
      getByIdAsync: vi.fn().mockImplementation((id: string) => {
        if (id === 'task-1') {
          return Promise.resolve({
            id: 'task-1',
            title: 'Test Task',
            status: EStatus.DONE,
            priority: EPriority.MEDIUM,
            recurrenceTemplateId: 'template-1',
            dueDate: new Date('2024-01-15'),
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-15T00:00:00.000Z',
          } as ITask);
        }
        return Promise.resolve(null);
      }),
      createAsync: vi.fn().mockImplementation((task: ITask) => {
        return Promise.resolve(task);
      }),
    } as unknown as ITaskRepository;

    mockUnitOfWork = {
      getTaskRepository: vi.fn().mockReturnValue(mockTaskRepository),
      getCategoryRepository: vi.fn(),
      getRecurrenceTemplateRepository: vi.fn().mockReturnValue(mockRecurrenceTemplateRepository),
      getRecurrenceCalculator: vi.fn(),
      beginTransaction: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
      rollbackAsync: vi.fn().mockResolvedValue(undefined),
    } as unknown as IUnitOfWork;

    recurrenceService = new RecurrenceService(mockUnitOfWork);
  });

  describe('initializeAsync', () => {
    it('should initialize the recurrence service', async () => {
      await recurrenceService.initializeAsync();
      expect(mockRecurrenceTemplateRepository.initialize).toHaveBeenCalled();
    });
  });

  describe('getAllTemplatesAsync', () => {
    it('should return all recurrence templates', async () => {
      const result = await recurrenceService.getAllTemplatesAsync();
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('getTemplateByIdAsync', () => {
    it('should return template by id', async () => {
      const result = await recurrenceService.getTemplateByIdAsync('template-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('template-1');
    });

    it('should return null for non-existent template', async () => {
      const result = await recurrenceService.getTemplateByIdAsync('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('calculateNextOccurrenceAsync', () => {
    it('should calculate next day correctly', async () => {
      const template = mockTemplates[0]; // Daily template
      const currentDate = new Date('2024-01-15');
      
      const result = await recurrenceService.calculateNextOccurrenceAsync(template, currentDate);
      
      expect(result.getDate()).toBe(16); // Next day
    });

    it('should calculate next week correctly', async () => {
      const template = mockTemplates[1]; // Weekly template
      const currentDate = new Date('2024-01-15');
      
      const result = await recurrenceService.calculateNextOccurrenceAsync(template, currentDate);
      
      expect(result.getDate()).toBe(22); // 7 days later
    });

    it('should throw error for invalid interval value', async () => {
      const template: IRecurrenceTemplate = {
        id: 'invalid',
        name: 'Invalid',
        intervals: [{ unit: 'days', value: 0 }],
      };
      const currentDate = new Date('2024-01-15');
      
      await expect(recurrenceService.calculateNextOccurrenceAsync(template, currentDate))
        .rejects.toThrow('Interval value must be greater than 0');
    });
  });

  describe('generateNextTaskAsync', () => {
    it('should generate next task from completed recurring task', async () => {
      const completedTask: ITask = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Test Description',
        status: EStatus.DONE,
        priority: EPriority.MEDIUM,
        recurrenceTemplateId: 'template-1',
        dueDate: new Date('2024-01-15'),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      };

      const result = await recurrenceService.generateNextTaskAsync(completedTask);
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe(completedTask.title);
      expect(result?.status).toBe(EStatus.TODO);
      expect(result?.recurrenceTemplateId).toBe(completedTask.recurrenceTemplateId);
    });

    it('should return null for task without recurrence template', async () => {
      const completedTask: ITask = {
        id: 'task-2',
        title: 'Non-recurring Task',
        status: EStatus.DONE,
        priority: EPriority.MEDIUM,
        dueDate: new Date('2024-01-15'),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      };

      const result = await recurrenceService.generateNextTaskAsync(completedTask);
      
      expect(result).toBeNull();
    });

    it('should return null for non-existent template', async () => {
      const completedTask: ITask = {
        id: 'task-3',
        title: 'Task with bad template',
        status: EStatus.DONE,
        priority: EPriority.MEDIUM,
        recurrenceTemplateId: 'non-existent-template',
        dueDate: new Date('2024-01-15'),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      };

      const result = await recurrenceService.generateNextTaskAsync(completedTask);
      
      expect(result).toBeNull();
    });
  });

  describe('canGenerateNextInstance', () => {
    it('should return true for task with recurrence template', () => {
      const task: ITask = {
        id: 'task-1',
        title: 'Test',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        recurrenceTemplateId: 'template-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(recurrenceService.canGenerateNextInstance(task)).toBe(true);
    });

    it('should return false for task without recurrence template', () => {
      const task: ITask = {
        id: 'task-2',
        title: 'Test',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(recurrenceService.canGenerateNextInstance(task)).toBe(false);
    });
  });
});
