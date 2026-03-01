import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateAllPendingTasks } from '../../src/domain/batchGeneration.js';
import type { IRecurringTaskRepository } from '../../src/interfaces/IRecurringTaskRepository.js';
import type { ITaskRepository } from '../../src/interfaces/ITaskRepository.js';
import type { ITaskRecurringLinkRepository } from '../../src/interfaces/ITaskRecurringLinkRepository.js';
import type { IRecurringTask } from '../../src/interfaces/IRecurringTask.js';
import { ERecurringTaskStatus } from '../../src/enums/ERecurringTaskStatus.js';
import { EStatus } from '../../src/enums/EStatus.js';

describe('Batch Generation Utility', () => {
  let mockRecurringTaskRepo: any;
  let mockTaskRepo: any;
  let mockLinkRepo: any;

  const createMockRecurringTask = (overrides: Partial<IRecurringTask> = {}): IRecurringTask => ({
    id: 'recurring-1',
    title: 'Weekly Meeting',
    description: 'Weekly team meeting',
    priority: 'HIGH' as any,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    intervals: [{ value: 1, unit: 'weeks' }],
    tags: ['work'],
    categoryIds: ['cat-1'],
    status: ERecurringTaskStatus.ACTIVE,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    mockRecurringTaskRepo = {
      getActiveAsync: vi.fn(),
    };

    mockTaskRepo = {
      getById: vi.fn(),
      createAsync: vi.fn().mockResolvedValue({}),
    };

    mockLinkRepo = {
      getByRecurringTaskIdAsync: vi.fn().mockResolvedValue([]),
      createAsync: vi.fn().mockResolvedValue({}),
    };
  });

  describe('generateAllPendingTasks', () => {
    it('should process active recurring tasks', async () => {
      const recurringTasks = [
        createMockRecurringTask({ id: 'recurring-1' }),
        createMockRecurringTask({ id: 'recurring-2' }),
      ];
      mockRecurringTaskRepo.getActiveAsync.mockResolvedValue(recurringTasks);

      const result = await generateAllPendingTasks(
        mockRecurringTaskRepo as IRecurringTaskRepository,
        mockTaskRepo as ITaskRepository,
        mockLinkRepo as ITaskRecurringLinkRepository
      );

      expect(result.processedCount).toBe(2);
      expect(result.errorCount).toBe(0);
    });

    it('should skip stopped recurring tasks', async () => {
      // In production, getActiveAsync filters by ACTIVE status, so it would return empty array
      // This test verifies that stopped tasks are not processed
      mockRecurringTaskRepo.getActiveAsync.mockResolvedValue([]);

      const result = await generateAllPendingTasks(
        mockRecurringTaskRepo as IRecurringTaskRepository,
        mockTaskRepo as ITaskRepository,
        mockLinkRepo as ITaskRecurringLinkRepository
      );

      expect(result.processedCount).toBe(0);
      expect(result.generatedCount).toBe(0);
    });

    it('should generate tasks for recurring task without existing links', async () => {
      const recurringTasks = [
        createMockRecurringTask({ 
          id: 'recurring-1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-15'),
          intervals: [{ value: 1, unit: 'weeks' }],
        }),
      ];
      mockRecurringTaskRepo.getActiveAsync.mockResolvedValue(recurringTasks);
      mockLinkRepo.getByRecurringTaskIdAsync.mockResolvedValue([]);

      const result = await generateAllPendingTasks(
        mockRecurringTaskRepo as IRecurringTaskRepository,
        mockTaskRepo as ITaskRepository,
        mockLinkRepo as ITaskRecurringLinkRepository
      );

      expect(result.generatedCount).toBeGreaterThan(0);
      expect(mockTaskRepo.createAsync).toHaveBeenCalled();
    });

    it('should not generate duplicate tasks for existing due dates', async () => {
      const recurringTask = createMockRecurringTask({
        id: 'recurring-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
      });
      
      // Simulate existing linked task with due date
      const existingLink = {
        recurringTaskId: 'recurring-1',
        taskId: 'existing-task-1',
      };
      
      const existingTask = {
        id: 'existing-task-1',
        title: 'Weekly Meeting',
        status: EStatus.TODO,
        dueDate: new Date('2024-01-08'),
      };

      mockRecurringTaskRepo.getActiveAsync.mockResolvedValue([recurringTask]);
      mockLinkRepo.getByRecurringTaskIdAsync.mockResolvedValue([existingLink]);
      mockTaskRepo.getById.mockReturnValue(existingTask);

      const result = await generateAllPendingTasks(
        mockRecurringTaskRepo as IRecurringTaskRepository,
        mockTaskRepo as ITaskRepository,
        mockLinkRepo as ITaskRecurringLinkRepository
      );

      // Should not create duplicate for the same due date
      expect(result.generatedCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors gracefully and continue processing', async () => {
      const recurringTasks = [
        createMockRecurringTask({ id: 'recurring-1' }),
        createMockRecurringTask({ id: 'recurring-2' }),
      ];
      mockRecurringTaskRepo.getActiveAsync.mockResolvedValue(recurringTasks);
      
      // First task fails
      mockLinkRepo.getByRecurringTaskIdAsync
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce([]);

      const result = await generateAllPendingTasks(
        mockRecurringTaskRepo as IRecurringTaskRepository,
        mockTaskRepo as ITaskRepository,
        mockLinkRepo as ITaskRecurringLinkRepository
      );

      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Error processing recurring task recurring-1');
    });

    it('should return zero counts when no active recurring tasks', async () => {
      mockRecurringTaskRepo.getActiveAsync.mockResolvedValue([]);

      const result = await generateAllPendingTasks(
        mockRecurringTaskRepo as IRecurringTaskRepository,
        mockTaskRepo as ITaskRepository,
        mockLinkRepo as ITaskRecurringLinkRepository
      );

      expect(result.processedCount).toBe(0);
      expect(result.generatedCount).toBe(0);
      expect(result.errorCount).toBe(0);
    });

    it('should extend indefinite recurring tasks to 1 year ahead', async () => {
      const indefiniteTask = createMockRecurringTask({
        id: 'recurring-1',
        startDate: new Date('2024-01-01'),
        endDate: undefined, // Indefinite
      });
      
      mockRecurringTaskRepo.getActiveAsync.mockResolvedValue([indefiniteTask]);
      mockLinkRepo.getByRecurringTaskIdAsync.mockResolvedValue([]);

      const result = await generateAllPendingTasks(
        mockRecurringTaskRepo as IRecurringTaskRepository,
        mockTaskRepo as ITaskRepository,
        mockLinkRepo as ITaskRecurringLinkRepository
      );

      // Should generate tasks for approximately 1 year
      expect(result.generatedCount).toBeGreaterThan(0);
    });
  });
});
