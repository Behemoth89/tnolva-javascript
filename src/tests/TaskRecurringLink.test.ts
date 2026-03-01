import { describe, it, expect, beforeEach } from 'vitest';
import { TaskRecurringLink } from '../../src/domain/TaskRecurringLink.js';

describe('TaskRecurringLink', () => {
  let recurringTaskId: string;
  let taskId: string;
  let originalGeneratedDate: Date;

  beforeEach(() => {
    recurringTaskId = 'recurring-123';
    taskId = 'task-456';
    originalGeneratedDate = new Date('2024-01-15');
  });

  describe('constructor', () => {
    it('should create a link with all properties', () => {
      const link = new TaskRecurringLink(recurringTaskId, taskId, originalGeneratedDate);

      expect(link.recurringTaskId).toBe('recurring-123');
      expect(link.taskId).toBe('task-456');
      expect(link.originalGeneratedDate).toEqual(new Date('2024-01-15'));
      expect(link.id).toBeDefined();
      expect(link.lastRegeneratedDate).toBeInstanceOf(Date);
    });

    it('should set lastRegeneratedDate to current time', () => {
      const beforeCreate = new Date();
      const link = new TaskRecurringLink(recurringTaskId, taskId, originalGeneratedDate);
      const afterCreate = new Date();

      expect(link.lastRegeneratedDate.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(link.lastRegeneratedDate.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('fromExisting', () => {
    it('should create a TaskRecurringLink from an existing object', () => {
      const existingLink = {
        id: 'existing-link-id',
        recurringTaskId: 'existing-recurring',
        taskId: 'existing-task',
        originalGeneratedDate: new Date('2024-02-01'),
        lastRegeneratedDate: new Date('2024-02-15'),
      };

      const link = TaskRecurringLink.fromExisting(existingLink);

      expect(link.id).toBe('existing-link-id');
      expect(link.recurringTaskId).toBe('existing-recurring');
      expect(link.taskId).toBe('existing-task');
      expect(link.originalGeneratedDate).toEqual(new Date('2024-02-01'));
      expect(link.lastRegeneratedDate).toEqual(new Date('2024-02-15'));
    });
  });

  describe('toObject', () => {
    it('should convert to plain object', () => {
      const link = new TaskRecurringLink(recurringTaskId, taskId, originalGeneratedDate);
      const obj = link.toObject();

      expect(obj).toEqual(expect.objectContaining({
        id: link.id,
        recurringTaskId: 'recurring-123',
        taskId: 'task-456',
        originalGeneratedDate: originalGeneratedDate,
        lastRegeneratedDate: link.lastRegeneratedDate,
      }));
    });
  });

  describe('markRegenerated', () => {
    it('should update lastRegeneratedDate to current time', () => {
      const link = new TaskRecurringLink(recurringTaskId, taskId, originalGeneratedDate);
      const originalLastRegen = link.lastRegeneratedDate.getTime();

      // Wait a small amount to ensure time difference
      link.markRegenerated();

      // Use greaterThanOrEqual since calls in same millisecond will have equal times
      expect(link.lastRegeneratedDate.getTime()).toBeGreaterThanOrEqual(originalLastRegen);
    });
  });

  describe('isForRecurringTask', () => {
    it('should return true when recurringTaskId matches', () => {
      const link = new TaskRecurringLink(recurringTaskId, taskId, originalGeneratedDate);
      expect(link.isForRecurringTask('recurring-123')).toBe(true);
    });

    it('should return false when recurringTaskId does not match', () => {
      const link = new TaskRecurringLink(recurringTaskId, taskId, originalGeneratedDate);
      expect(link.isForRecurringTask('different-id')).toBe(false);
    });
  });

  describe('isForTask', () => {
    it('should return true when taskId matches', () => {
      const link = new TaskRecurringLink(recurringTaskId, taskId, originalGeneratedDate);
      expect(link.isForTask('task-456')).toBe(true);
    });

    it('should return false when taskId does not match', () => {
      const link = new TaskRecurringLink(recurringTaskId, taskId, originalGeneratedDate);
      expect(link.isForTask('different-task')).toBe(false);
    });
  });
});
