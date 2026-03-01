/**
 * Integration Tests for UnitOfWork.completeTaskWithRecurrence()
 * Tests for task completion with recurrence generation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { UnitOfWork } from '../data/unit-of-work/UnitOfWork.js';
import { LocalStorageAdapter } from '../data/adapters/LocalStorageAdapter.js';
import { Task } from '../domain/Task.js';
import { RecurrenceTemplate } from '../domain/RecurrenceTemplate.js';
import { EStatus } from '../enums/EStatus.js';
import { EPriority } from '../enums/EPriority.js';

describe('UnitOfWork completeTaskWithRecurrence', () => {
  let uow: UnitOfWork;
  let storage: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageAdapter('test_');
    uow = new UnitOfWork(storage);
  });

  describe('completeTaskWithRecurrence', () => {
    it('should return null when task does not exist', async () => {
      const result = await uow.completeTaskWithRecurrence('non-existent');
      expect(result).toBeNull();
    });

    it('should complete task and return null without recurrence template', async () => {
      // Create a task without recurrence using repository
      const task = new Task({
        id: 'task-1',
        title: 'One-time Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        dueDate: new Date('2024-01-15'),
      });

      // Save via repository to ensure proper storage
      const taskRepo = uow.getTaskRepository();
      await taskRepo.createAsync(task);

      // Complete task
      const result = await uow.completeTaskWithRecurrence('task-1');

      // Verify null is returned (no new task created)
      expect(result).toBeNull();
    });

    it('should generate new task when task has recurrence template', async () => {
      // Create a recurrence template
      const template = new RecurrenceTemplate({
        id: 'template-daily',
        name: 'Daily',
        intervals: [{ value: 1, unit: 'days' }],
      });

      // Save template directly to the correct storage key
      const templateRepo = new (await import('../data/repositories/RecurrenceTemplateRepository.js')).RecurrenceTemplateRepository(storage);
      await templateRepo.createAsync(template);

      // Create a task with recurrence
      const task = new Task({
        id: 'task-1',
        title: 'Daily Standup',
        description: 'Morning meeting',
        status: EStatus.TODO,
        priority: EPriority.HIGH,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-daily',
      });

      // Save via repository
      const taskRepo = uow.getTaskRepository();
      await taskRepo.createAsync(task);

      // Complete task with recurrence
      const newTask = await uow.completeTaskWithRecurrence('task-1');

      // Verify new task was created
      expect(newTask).not.toBeNull();
      expect(newTask?.title).toBe('Daily Standup');
      expect(newTask?.description).toBe('Morning meeting');
      expect(newTask?.status).toBe(EStatus.TODO);
      expect(newTask?.priority).toBe(EPriority.HIGH);
      expect(newTask?.recurrenceTemplateId).toBe('template-daily');
      
      // Verify due date was advanced by 1 day
      const newDueDate = newTask?.dueDate;
      expect(newDueDate).toBeInstanceOf(Date);
      expect(newDueDate?.getDate()).toBe(16); // Next day

      // Verify total tasks count (original + new)
      const allTasks = await taskRepo.getAllAsync();
      expect(allTasks).toHaveLength(2);
    });

    it('should preserve tags in generated task', async () => {
      // Create a recurrence template
      const template = new RecurrenceTemplate({
        id: 'template-daily',
        name: 'Daily',
        intervals: [{ value: 1, unit: 'days' }],
      });

      const templateRepo = new (await import('../data/repositories/RecurrenceTemplateRepository.js')).RecurrenceTemplateRepository(storage);
      await templateRepo.createAsync(template);

      // Create a task with tags
      const task = new Task({
        id: 'task-1',
        title: 'Task with Tags',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        tags: ['work', 'important'],
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-daily',
      });

      const taskRepo = uow.getTaskRepository();
      await taskRepo.createAsync(task);

      // Complete task with recurrence
      const newTask = await uow.completeTaskWithRecurrence('task-1');

      // Verify tags are preserved
      expect(newTask?.tags).toEqual(['work', 'important']);
    });

    it('should generate task with weekly recurrence', async () => {
      // Create weekly template
      const template = new RecurrenceTemplate({
        id: 'template-weekly',
        name: 'Weekly',
        intervals: [{ value: 1, unit: 'weeks' }],
      });

      const templateRepo = new (await import('../data/repositories/RecurrenceTemplateRepository.js')).RecurrenceTemplateRepository(storage);
      await templateRepo.createAsync(template);

      // Create a task with weekly recurrence
      const task = new Task({
        id: 'task-1',
        title: 'Weekly Meeting',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-weekly',
      });

      const taskRepo = uow.getTaskRepository();
      await taskRepo.createAsync(task);

      // Complete task with recurrence
      const newTask = await uow.completeTaskWithRecurrence('task-1');

      // Verify next due date is 1 week later
      expect(newTask?.dueDate?.getDate()).toBe(22);
      expect(newTask?.dueDate?.getMonth()).toBe(0);
    });

    it('should generate task with monthly recurrence', async () => {
      // Create monthly template
      const template = new RecurrenceTemplate({
        id: 'template-monthly',
        name: 'Monthly',
        intervals: [{ value: 1, unit: 'months' }],
      });

      const templateRepo = new (await import('../data/repositories/RecurrenceTemplateRepository.js')).RecurrenceTemplateRepository(storage);
      await templateRepo.createAsync(template);

      // Create a task with monthly recurrence
      const task = new Task({
        id: 'task-1',
        title: 'Monthly Report',
        status: EStatus.TODO,
        priority: EPriority.LOW,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'template-monthly',
      });

      const taskRepo = uow.getTaskRepository();
      await taskRepo.createAsync(task);

      // Complete task with recurrence
      const newTask = await uow.completeTaskWithRecurrence('task-1');

      // Verify next due date is 1 month later
      expect(newTask?.dueDate?.getMonth()).toBe(1); // February
      expect(newTask?.dueDate?.getDate()).toBe(15);
    });

    it('should return null when recurrence template does not exist', async () => {
      // Create a task with non-existent template
      const task = new Task({
        id: 'task-1',
        title: 'Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
        dueDate: new Date('2024-01-15'),
        recurrenceTemplateId: 'non-existent-template',
      });

      const taskRepo = uow.getTaskRepository();
      await taskRepo.createAsync(task);

      // Complete task - should return null since template doesn't exist
      const result = await uow.completeTaskWithRecurrence('task-1');

      // Verify null is returned (no new task created)
      expect(result).toBeNull();
    });
  });
});
