import { describe, it, expect, beforeEach } from 'vitest';
import { RecurringTask } from '../../src/domain/RecurringTask.js';
import { ERecurringTaskStatus } from '../../src/enums/ERecurringTaskStatus.js';
import { EPriority } from '../../src/enums/EPriority.js';

describe('RecurringTask', () => {
  let mockDto: any;

  beforeEach(() => {
    mockDto = {
      title: 'Test Recurring Task',
      description: 'Test description',
      priority: EPriority.HIGH,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      intervals: [{ value: 1, unit: 'weeks' as const }],
      tags: ['work', 'important'],
      categoryIds: ['cat-1', 'cat-2'],
    };
  });

  describe('constructor', () => {
    it('should create a recurring task with all properties', () => {
      const task = new RecurringTask(mockDto);

      expect(task.title).toBe('Test Recurring Task');
      expect(task.description).toBe('Test description');
      expect(task.priority).toBe(EPriority.HIGH);
      expect(task.status).toBe(ERecurringTaskStatus.ACTIVE);
      expect(task.tags).toEqual(['work', 'important']);
      expect(task.categoryIds).toEqual(['cat-1', 'cat-2']);
      expect(task.intervals).toHaveLength(1);
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });

    it('should use default values when optional properties are missing', () => {
      const minimalDto = {
        title: 'Minimal Task',
        startDate: new Date(),
        intervals: [{ value: 1, unit: 'days' as const }],
      };

      const task = new RecurringTask(minimalDto);

      expect(task.priority).toBe(EPriority.MEDIUM);
      expect(task.tags).toEqual([]);
      expect(task.categoryIds).toEqual([]);
      expect(task.description).toBeUndefined();
      expect(task.endDate).toBeUndefined();
    });

    it('should trim title and description', () => {
      const dtoWithWhitespace = {
        title: '  Trimmed Title  ',
        description: '  Trimmed Description  ',
        startDate: new Date(),
        intervals: [{ value: 1, unit: 'days' as const }],
      };

      const task = new RecurringTask(dtoWithWhitespace);

      expect(task.title).toBe('Trimmed Title');
      expect(task.description).toBe('Trimmed Description');
    });

    it('should use provided ID if given', () => {
      const dtoWithId = {
        ...mockDto,
        id: 'custom-id-123',
      };

      const task = new RecurringTask(dtoWithId);

      expect(task.id).toBe('custom-id-123');
    });
  });

  describe('fromExisting', () => {
    it('should create a RecurringTask from an existing IRecurringTask object', () => {
      const existingTask: any = {
        id: 'existing-id',
        title: 'Existing Task',
        description: 'Existing description',
        priority: EPriority.LOW,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        intervals: [{ value: 2, unit: 'months' as const }],
        tags: ['existing-tag'],
        categoryIds: ['existing-cat'],
        status: ERecurringTaskStatus.STOPPED,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      };

      const task = RecurringTask.fromExisting(existingTask);

      expect(task.id).toBe('existing-id');
      expect(task.title).toBe('Existing Task');
      expect(task.status).toBe(ERecurringTaskStatus.STOPPED);
      expect(task.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(task.updatedAt).toBe('2024-01-15T00:00:00.000Z');
    });
  });

  describe('toObject', () => {
    it('should convert to plain object', () => {
      const task = new RecurringTask(mockDto);
      const obj = task.toObject();

      expect(obj).toEqual(expect.objectContaining({
        id: task.id,
        title: 'Test Recurring Task',
        description: 'Test description',
        priority: EPriority.HIGH,
        status: ERecurringTaskStatus.ACTIVE,
        tags: ['work', 'important'],
        categoryIds: ['cat-1', 'cat-2'],
      }));
      expect(obj.intervals).not.toBe(mockDto.intervals); // Should be a copy
    });
  });

  describe('isActive', () => {
    it('should return true when status is ACTIVE', () => {
      const task = new RecurringTask(mockDto);
      expect(task.isActive()).toBe(true);
    });

    it('should return false when status is STOPPED', () => {
      const task = new RecurringTask(mockDto);
      task.status = ERecurringTaskStatus.STOPPED;
      expect(task.isActive()).toBe(false);
    });
  });

  describe('hasEndDate', () => {
    it('should return true when endDate is set', () => {
      const task = new RecurringTask(mockDto);
      expect(task.hasEndDate()).toBe(true);
    });

    it('should return false when endDate is undefined', () => {
      const noEndDateDto = {
        title: 'No End Date',
        startDate: new Date(),
        intervals: [{ value: 1, unit: 'days' as const }],
      };
      const task = new RecurringTask(noEndDateDto);
      expect(task.hasEndDate()).toBe(false);
    });

    it('should return false when endDate is null', () => {
      const nullEndDateDto = {
        ...mockDto,
        endDate: null,
      };
      const task = new RecurringTask(nullEndDateDto as any);
      expect(task.hasEndDate()).toBe(false);
    });
  });

  describe('isIndefinite', () => {
    it('should return false when endDate is set', () => {
      const task = new RecurringTask(mockDto);
      expect(task.isIndefinite()).toBe(false);
    });

    it('should return true when endDate is not set', () => {
      const noEndDateDto = {
        title: 'Indefinite Task',
        startDate: new Date(),
        intervals: [{ value: 1, unit: 'days' as const }],
      };
      const task = new RecurringTask(noEndDateDto);
      expect(task.isIndefinite()).toBe(true);
    });
  });
});
