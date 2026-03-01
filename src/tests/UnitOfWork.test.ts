import { describe, it, expect, beforeEach } from 'vitest';
import { UnitOfWork } from '../data/unit-of-work/UnitOfWork.js';
import { LocalStorageAdapter } from '../data/adapters/LocalStorageAdapter.js';
import { Task } from '../domain/Task.js';
import { EStatus } from '../enums/EStatus.js';
import { EPriority } from '../enums/EPriority.js';

describe('UnitOfWork', () => {
  let uow: UnitOfWork;
  let storage: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageAdapter('test_');
    uow = new UnitOfWork(storage);
  });

  describe('registerNew and commit', () => {
    it('should register and commit new entities', async () => {
      const task = new Task({
        id: 'task-1',
        title: 'New Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
      });

      uow.registerNew(task, 'task');
      await uow.commit();

      const repo = uow.getTaskRepository();
      const tasks = await repo.getAllAsync();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('New Task');
    });
  });

  describe('registerModified and commit', () => {
    it('should register and commit modified entities', async () => {
      const task = new Task({
        id: 'task-1',
        title: 'Original Title',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
      });

      // First create the task directly
      const repo = uow.getTaskRepository();
      await repo.createAsync(task);

      // Modify and register
      const existing = await repo.getByIdAsync('task-1');
      if (!existing) throw new Error('Task not found');
      existing.title = 'Modified Title';
      uow.registerModified(existing, 'task');
      await uow.commit();

      const updated = await repo.getByIdAsync('task-1');
      if (!updated) throw new Error('Task not found');
      expect(updated.title).toBe('Modified Title');
    });
  });

  describe('registerDeleted and commit', () => {
    it('should register and commit deleted entities', async () => {
      const task = new Task({
        id: 'task-1',
        title: 'Task to Delete',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
      });

      // First create the task directly
      const repo = uow.getTaskRepository();
      await repo.createAsync(task);

      // Register for deletion
      const existing = await repo.getByIdAsync('task-1');
      uow.registerDeleted(existing, 'task');
      await uow.commit();

      const exists = await repo.existsAsync('task-1');
      expect(exists).toBe(false);
    });
  });

  describe('rollback', () => {
    it('should discard all changes on rollback', async () => {
      const task = new Task({
        id: 'task-1',
        title: 'New Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
      });

      uow.registerNew(task, 'task');
      uow.rollback();

      const repo = uow.getTaskRepository();
      const tasks = await repo.getAllAsync();
      expect(tasks).toHaveLength(0);
    });

    it('should be able to commit new changes after rollback', async () => {
      const task = new Task({
        id: 'task-1',
        title: 'New Task',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
      });

      uow.registerNew(task, 'task');
      uow.rollback();

      // After rollback, should be able to register new changes and commit
      const newTask = new Task({
        id: 'task-2',
        title: 'Task After Rollback',
        status: EStatus.TODO,
        priority: EPriority.MEDIUM,
      });
      uow.registerNew(newTask, 'task');
      await uow.commit();

      const repo = uow.getTaskRepository();
      const tasks = await repo.getAllAsync();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Task After Rollback');
    });
  });

  describe('multiple changes', () => {
    it('should commit multiple changes atomically', async () => {
      const task1 = new Task({ id: 'task-1', title: 'Task 1', status: EStatus.TODO, priority: EPriority.MEDIUM });
      const task2 = new Task({ id: 'task-2', title: 'Task 2', status: EStatus.TODO, priority: EPriority.MEDIUM });

      uow.registerNew(task1, 'task');
      uow.registerNew(task2, 'task');
      await uow.commit();

      const repo = uow.getTaskRepository();
      const tasks = await repo.getAllAsync();
      expect(tasks).toHaveLength(2);
    });
  });
});
