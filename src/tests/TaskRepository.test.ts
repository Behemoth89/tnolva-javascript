import { describe, it, expect, beforeEach } from 'vitest';
import { TaskRepository } from '../data/repositories/TaskRepository.js';
import { LocalStorageAdapter } from '../data/adapters/LocalStorageAdapter.js';
import { Task } from '../domain/Task.js';
import { EStatus } from '../enums/EStatus.js';
import { EPriority } from '../enums/EPriority.js';

describe('TaskRepository', () => {
  let repository: TaskRepository;
  let storage: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageAdapter('test_');
    repository = new TaskRepository(storage);
  });

  describe('createAsync', () => {
    it('should create a task with generated ID', async () => {
      const task = new Task({
        id: 'test-1',
        title: 'Test Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
      });

      const created = await repository.createAsync(task);

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Test Task');
    });

    it('should persist task to storage', async () => {
      const task = new Task({
        id: 'test-1',
        title: 'Test Task',
      });

      await repository.createAsync(task);

      const tasks = repository.getAll();
      expect(tasks).toHaveLength(1);
    });
  });

  describe('getAllAsync', () => {
    it('should return all tasks', async () => {
      const task1 = new Task({ id: 'task-1', title: 'Task 1' });
      const task2 = new Task({ id: 'task-2', title: 'Task 2' });

      await repository.createAsync(task1);
      await repository.createAsync(task2);

      const tasks = await repository.getAllAsync();
      expect(tasks).toHaveLength(2);
    });

    it('should return empty array when no tasks', async () => {
      const tasks = await repository.getAllAsync();
      expect(tasks).toHaveLength(0);
    });
  });

  describe('getByIdAsync', () => {
    it('should return task by ID', async () => {
      const task = new Task({ id: 'task-1', title: 'Test Task' });
      await repository.createAsync(task);

      const found = await repository.getByIdAsync('task-1');

      expect(found).not.toBeNull();
      expect(found?.title).toBe('Test Task');
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.getByIdAsync('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('updateAsync', () => {
    it('should update an existing task', async () => {
      const task = new Task({ id: 'task-1', title: 'Original Title' });
      await repository.createAsync(task);

      const updated = await repository.updateAsync('task-1', { title: 'Updated Title' });

      expect(updated?.title).toBe('Updated Title');
    });

    it('should return null for non-existent task', async () => {
      const updated = await repository.updateAsync('nonexistent', { title: 'Test' });
      expect(updated).toBeNull();
    });
  });

  describe('deleteAsync', () => {
    it('should delete a task', async () => {
      const task = new Task({ id: 'task-1', title: 'Test Task' });
      await repository.createAsync(task);

      const deleted = await repository.deleteAsync('task-1');

      expect(deleted).toBe(true);
      expect(repository.getAll()).toHaveLength(0);
    });

    it('should return false for non-existent task', async () => {
      const deleted = await repository.deleteAsync('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('createBatchAsync', () => {
    it('should create multiple tasks', async () => {
      const tasks = [
        new Task({ id: 'task-1', title: 'Task 1' }),
        new Task({ id: 'task-2', title: 'Task 2' }),
        new Task({ id: 'task-3', title: 'Task 3' }),
      ];

      const created = await repository.createBatchAsync(tasks);

      expect(created).toHaveLength(3);
      expect(repository.getAll()).toHaveLength(3);
    });
  });

  describe('deleteBatchAsync', () => {
    it('should delete multiple tasks', async () => {
      const task1 = new Task({ id: 'task-1', title: 'Task 1' });
      const task2 = new Task({ id: 'task-2', title: 'Task 2' });
      const task3 = new Task({ id: 'task-3', title: 'Task 3' });

      await repository.createBatchAsync([task1, task2, task3]);

      const deletedCount = await repository.deleteBatchAsync(['task-1', 'task-2']);

      expect(deletedCount).toBe(2);
      expect(repository.getAll()).toHaveLength(1);
    });
  });

  describe('existsAsync', () => {
    it('should return true for existing task', async () => {
      const task = new Task({ id: 'task-1', title: 'Test Task' });
      await repository.createAsync(task);

      const exists = await repository.existsAsync('task-1');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent task', async () => {
      const exists = await repository.existsAsync('nonexistent');
      expect(exists).toBe(false);
    });
  });

  describe('getByStatusAsync', () => {
    it('should filter tasks by status', async () => {
      const task1 = new Task({ id: 'task-1', title: 'Task 1', status: EStatus.TODO });
      const task2 = new Task({ id: 'task-2', title: 'Task 2', status: EStatus.IN_PROGRESS });
      const task3 = new Task({ id: 'task-3', title: 'Task 3', status: EStatus.TODO });

      await repository.createBatchAsync([task1, task2, task3]);

      const todoTasks = await repository.getByStatusAsync(EStatus.TODO);

      expect(todoTasks).toHaveLength(2);
    });
  });

  describe('getByPriorityAsync', () => {
    it('should filter tasks by priority', async () => {
      const task1 = new Task({ id: 'task-1', title: 'Task 1', priority: EPriority.LOW });
      const task2 = new Task({ id: 'task-2', title: 'Task 2', priority: EPriority.HIGH });
      const task3 = new Task({ id: 'task-3', title: 'Task 3', priority: EPriority.LOW });

      await repository.createBatchAsync([task1, task2, task3]);

      const lowPriorityTasks = await repository.getByPriorityAsync(EPriority.LOW);

      expect(lowPriorityTasks).toHaveLength(2);
    });
  });
});
