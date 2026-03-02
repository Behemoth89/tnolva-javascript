import { describe, it, expect } from 'vitest';
import { TaskDependency } from '../domain/TaskDependency.js';
import { EDependencyType } from '../enums/EDependencyType.js';

describe('TaskDependency', () => {
  describe('constructor', () => {
    it('should create a TaskDependency with required fields', () => {
      const dependency = new TaskDependency({
        taskId: 'subtask-1',
        dependsOnTaskId: 'parent-1',
      });

      expect(dependency.id).toBeDefined();
      expect(dependency.taskId).toBe('subtask-1');
      expect(dependency.dependsOnTaskId).toBe('parent-1');
      expect(dependency.dependencyType).toBe(EDependencyType.SUBTASK);
      expect(dependency.createdAt).toBeDefined();
      expect(dependency.updatedAt).toBeDefined();
    });

    it('should create a TaskDependency with custom dependency type', () => {
      const dependency = new TaskDependency({
        taskId: 'subtask-1',
        dependsOnTaskId: 'parent-1',
        dependencyType: EDependencyType.SUBTASK,
      });

      expect(dependency.dependencyType).toBe(EDependencyType.SUBTASK);
    });
  });

  describe('toObject', () => {
    it('should convert to plain object', () => {
      const dependency = new TaskDependency({
        taskId: 'subtask-1',
        dependsOnTaskId: 'parent-1',
      });

      const obj = dependency.toObject();

      expect(obj.id).toBeDefined();
      expect(obj.taskId).toBe('subtask-1');
      expect(obj.dependsOnTaskId).toBe('parent-1');
      expect(obj.dependencyType).toBe(EDependencyType.SUBTASK);
      expect(obj.createdAt).toBeDefined();
      expect(obj.updatedAt).toBeDefined();
    });
  });
});
