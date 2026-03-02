import { describe, it, expect, beforeEach } from 'vitest';
import { TaskDependencyRepository } from '../data/repositories/TaskDependencyRepository.js';
import { LocalStorageAdapter } from '../data/adapters/LocalStorageAdapter.js';
import { TaskDependency } from '../domain/TaskDependency.js';
import { EDependencyType } from '../enums/EDependencyType.js';

describe('TaskDependencyRepository', () => {
  let repository: TaskDependencyRepository;
  let storage: LocalStorageAdapter;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    storage = new LocalStorageAdapter();
    repository = new TaskDependencyRepository(storage);
  });

  describe('getAllAsync', () => {
    it('should return empty array when no dependencies exist', async () => {
      const result = await repository.getAllAsync();
      expect(result).toEqual([]);
    });

    it('should return all stored dependencies', async () => {
      // Create test dependencies
      const dep1 = new TaskDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });
      const dep2 = new TaskDependency({
        taskId: 'task-2',
        dependsOnTaskId: 'parent-2',
        dependencyType: EDependencyType.SUBTASK,
      });

      await repository.createAsync(dep1);
      await repository.createAsync(dep2);

      const result = await repository.getAllAsync();
      expect(result).toHaveLength(2);
    });
  });

  describe('getByIdAsync', () => {
    it('should return null for non-existent dependency', async () => {
      const result = await repository.getByIdAsync('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('createAsync', () => {
    it('should create a new dependency', async () => {
      const dependency = new TaskDependency({
        taskId: 'subtask-1',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });

      const result = await repository.createAsync(dependency);

      expect(result.id).toBeDefined();
      expect(result.taskId).toBe('subtask-1');
      expect(result.dependsOnTaskId).toBe('parent-1');
    });
  });

  describe('getDependenciesForTaskAsync', () => {
    it('should return dependencies for a specific task', async () => {
      // Create dependencies for task-1
      const dep1 = new TaskDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });
      const dep2 = new TaskDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'parent-2',
        dependencyType: EDependencyType.SUBTASK,
      });
      // Create dependency for task-2
      const dep3 = new TaskDependency({
        taskId: 'task-2',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });

      await repository.createAsync(dep1);
      await repository.createAsync(dep2);
      await repository.createAsync(dep3);

      const result = await repository.getDependenciesForTaskAsync('task-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('getDependentsAsync', () => {
    it('should return tasks that depend on a specific task', async () => {
      // Create dependencies where parent-1 is depended on
      const dep1 = new TaskDependency({
        taskId: 'subtask-1',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });
      const dep2 = new TaskDependency({
        taskId: 'subtask-2',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });
      // Create dependency where parent-2 is depended on
      const dep3 = new TaskDependency({
        taskId: 'subtask-3',
        dependsOnTaskId: 'parent-2',
        dependencyType: EDependencyType.SUBTASK,
      });

      await repository.createAsync(dep1);
      await repository.createAsync(dep2);
      await repository.createAsync(dep3);

      const result = await repository.getDependentsAsync('parent-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('deleteAsync', () => {
    it('should delete a dependency', async () => {
      const dependency = new TaskDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });

      const created = await repository.createAsync(dependency);
      await repository.deleteAsync(created.id);

      const result = await repository.getByIdAsync(created.id);
      expect(result).toBeNull();
    });
  });

  describe('deleteByTaskId', () => {
    it('should delete all dependencies for a task', async () => {
      const dep1 = new TaskDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });
      const dep2 = new TaskDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'parent-2',
        dependencyType: EDependencyType.SUBTASK,
      });
      const dep3 = new TaskDependency({
        taskId: 'task-2',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });

      await repository.createAsync(dep1);
      await repository.createAsync(dep2);
      await repository.createAsync(dep3);

      await repository.deleteByTaskIdAsync('task-1');

      const allDeps = await repository.getAllAsync();
      expect(allDeps).toHaveLength(1);
    });
  });

  describe('hasDependencyAsync', () => {
    it('should return false when no dependency exists', async () => {
      const dependency = new TaskDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });
      await repository.createAsync(dependency);

      const result = await repository.hasDependencyAsync('task-1', 'parent-2');
      expect(result).toBe(false);
    });

    it('should return true when dependency exists', async () => {
      const dependency = new TaskDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });
      await repository.createAsync(dependency);

      const result = await repository.hasDependencyAsync('task-1', 'parent-1');
      expect(result).toBe(true);
    });
  });
});
