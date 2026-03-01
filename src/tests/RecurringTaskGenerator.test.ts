/**
 * Unit Tests for RecurringTaskGenerator
 * Tests for generating next task instances from recurring tasks
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { RecurringTaskGenerator } from '../domain/RecurringTaskGenerator.js';
import { Task } from '../domain/Task.js';
import { EStatus } from '../enums/EStatus.js';
import { EPriority } from '../enums/EPriority.js';

describe('RecurringTaskGenerator', () => {
  let generator: RecurringTaskGenerator;

  beforeEach(() => {
    generator = new RecurringTaskGenerator();
  });

  describe('generateNextInstance', () => {
    it('should generate next instance with updated due date', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Daily Standup',
        description: 'Morning meeting',
        status: EStatus.TODO,
        priority: EPriority.HIGH,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-1',
      });

      const template = {
        id: 'template-1',
        name: 'Daily',
        intervals: [{ value: 1, unit: 'days' as const }],
      };

      const result = generator.generateNextInstance(task.toObject(), template);

      expect(result.title).toBe('Daily Standup');
      expect(result.description).toBe('Morning meeting');
      expect(result.priority).toBe(EPriority.HIGH);
      expect(result.recurrenceTemplateId).toBe('template-1');
      expect(result.id).not.toBe('task-1'); // New ID generated
      expect(result.dueDate).toBeInstanceOf(Date);
      expect(result.dueDate?.getDate()).toBe(16); // Next day
    });

    it('should generate next instance for weekly recurrence', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Weekly Review',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-2',
      });

      const template = {
        id: 'template-2',
        name: 'Weekly',
        intervals: [{ value: 1, unit: 'weeks' as const }],
      };

      const result = generator.generateNextInstance(task.toObject(), template);

      expect(result.dueDate?.getDate()).toBe(22); // 1 week later
    });

    it('should generate next instance for monthly recurrence', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Monthly Report',
        status: EStatus.TODO,
        priority: EPriority.LOW,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-3',
      });

      const template = {
        id: 'template-3',
        name: 'Monthly',
        intervals: [{ value: 1, unit: 'months' as const }],
      };

      const result = generator.generateNextInstance(task.toObject(), template);

      expect(result.dueDate?.getMonth()).toBe(1); // February
      expect(result.dueDate?.getDate()).toBe(15);
    });

    it('should preserve tags from original task', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Task with Tags',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        tags: ['work', 'important', 'recurring'],
        recurrenceTemplateId: 'template-1',
      });

      const template = {
        id: 'template-1',
        name: 'Daily',
        intervals: [{ value: 1, unit: 'days' as const }],
      };

      const result = generator.generateNextInstance(task.toObject(), template);

      expect(result.tags).toEqual(['work', 'important', 'recurring']);
    });

    it('should use empty array for undefined tags', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Task without Tags',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        recurrenceTemplateId: 'template-1',
      });

      const template = {
        id: 'template-1',
        name: 'Daily',
        intervals: [{ value: 1, unit: 'days' as const }],
      };

      const result = generator.generateNextInstance(task.toObject(), template);

      expect(result.tags).toEqual([]);
    });

    it('should reset status to TODO when original was DONE', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Recurring Task',
        status: EStatus.DONE,
        priority: EPriority.MEDIUM,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-1',
      });

      const template = {
        id: 'template-1',
        name: 'Daily',
        intervals: [{ value: 1, unit: 'days' as const }],
      };

      const result = generator.generateNextInstance(task.toObject(), template);

      expect(result.status).toBe(EStatus.TODO);
    });

    it('should preserve status when original was not DONE', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Recurring Task',
        status: EStatus.IN_PROGRESS,
        priority: EPriority.MEDIUM,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-1',
      });

      const template = {
        id: 'template-1',
        name: 'Daily',
        intervals: [{ value: 1, unit: 'days' as const }],
      };

      const result = generator.generateNextInstance(task.toObject(), template);

      expect(result.status).toBe(EStatus.IN_PROGRESS);
    });

    it('should generate unique ID for each new instance', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Daily Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-1',
      });

      const template = {
        id: 'template-1',
        name: 'Daily',
        intervals: [{ value: 1, unit: 'days' as const }],
      };

      const result1 = generator.generateNextInstance(task.toObject(), template);
      const result2 = generator.generateNextInstance(task.toObject(), template);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).not.toBe('task-1');
      expect(result2.id).not.toBe('task-1');
    });

    it('should use current date when dueDate is undefined', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Task without due date',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        recurrenceTemplateId: 'template-1',
      });

      const template = {
        id: 'template-1',
        name: 'Daily',
        intervals: [{ value: 1, unit: 'days' as const }],
      };

      const result = generator.generateNextInstance(task.toObject(), template);

      expect(result.dueDate).toBeInstanceOf(Date);
    });

    it('should handle compound intervals', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Bi-weekly Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        dueDate: new Date('2024-01-01'),
        recurrenceTemplateId: 'template-1',
      });

      const template = {
        id: 'template-1',
        name: 'Bi-weekly',
        intervals: [
          { value: 2, unit: 'weeks' as const },
          { value: 3, unit: 'days' as const },
        ],
      };

      const result = generator.generateNextInstance(task.toObject(), template);

      // 2 weeks (14 days) + 3 days = 17 days from Jan 1
      expect(result.dueDate?.getDate()).toBe(18);
    });

    it('should handle weekday-based recurrence', () => {
      const task = new Task({
        id: 'task-1',
        title: 'First Monday',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-1',
      });

      const template = {
        id: 'template-1',
        name: 'First Monday of Month',
        intervals: [{ value: 1, unit: 'months' as const }],
        weekday: 1,
        occurrenceInMonth: 1,
      };

      const result = generator.generateNextInstance(task.toObject(), template);

      expect(result.dueDate?.getDay()).toBe(1); // Monday
      expect(result.dueDate?.getMonth()).toBe(1); // February
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Test Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-1',
      });

      const template = {
        id: 'template-1',
        name: 'Daily',
        intervals: [{ value: 1, unit: 'days' as const }],
      };

      const result = generator.generateNextInstance(task.toObject(), template);

      expect(result.createdAt).toBeDefined();
      expect(typeof result.createdAt).toBe('string');
      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      expect(result.updatedAt).toBeDefined();
      expect(typeof result.updatedAt).toBe('string');
      expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('canGenerateNextInstance', () => {
    it('should return true when task has recurrenceTemplateId', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Recurring Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        recurrenceTemplateId: 'template-1',
      });

      expect(generator.canGenerateNextInstance(task.toObject())).toBe(true);
    });

    it('should return false when task does not have recurrenceTemplateId', () => {
      const task = new Task({
        id: 'task-1',
        title: 'Non-recurring Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
      });

      expect(generator.canGenerateNextInstance(task.toObject())).toBe(false);
    });

    it('should return false when recurrenceTemplateId is empty string', () => {
      const taskData = {
        id: 'task-1',
        title: 'Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        recurrenceTemplateId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(generator.canGenerateNextInstance(taskData)).toBe(false);
    });
  });
});
