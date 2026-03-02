import type { ITaskDependencyService, DueDateConflictResult } from '../interfaces/ITaskDependencyService.js';
import type { ITaskEntity, IUnitOfWork, ITaskDependencyRepository, ITaskRepository } from '../../interfaces/index.js';
import { EDependencyType } from '../../enums/EDependencyType.js';
import { EStatus } from '../../enums/EStatus.js';
import { TaskDependency } from '../../domain/TaskDependency.js';

/**
 * TaskDependencyService Class
 * Implements business logic for task dependency operations
 */
export class TaskDependencyService implements ITaskDependencyService {
  private readonly unitOfWork: IUnitOfWork;
  private readonly taskDependencyRepository: ITaskDependencyRepository;
  private readonly taskRepository: ITaskRepository;

  /**
   * Creates a new TaskDependencyService instance
   * @param unitOfWork - The UnitOfWork for data access
   */
  constructor(unitOfWork: IUnitOfWork) {
    this.unitOfWork = unitOfWork;
    this.taskDependencyRepository = unitOfWork.getTaskDependencyRepository();
    this.taskRepository = unitOfWork.getTaskRepository();
  }

  /**
   * Add a subtask to a main task
   */
  async addSubtaskAsync(subtaskId: string, parentTaskId: string): Promise<void> {
    // Validate both tasks exist
    const subtask = await this.taskRepository.getByIdAsync(subtaskId);
    if (!subtask) {
      throw new Error('Subtask not found');
    }

    const parentTask = await this.taskRepository.getByIdAsync(parentTaskId);
    if (!parentTask) {
      throw new Error('Parent task not found');
    }

    // Check if dependency already exists
    const alreadyExists = await this.taskDependencyRepository.hasDependencyAsync(subtaskId, parentTaskId);
    if (alreadyExists) {
      throw new Error('Dependency already exists between these tasks');
    }

    // Check for direct circular reference: does parent already depend on subtask?
    const hasReverseDependency = await this.taskDependencyRepository.hasDependencyAsync(parentTaskId, subtaskId);
    if (hasReverseDependency) {
      throw new Error('Cannot create dependency: circular reference detected');
    }

    // Check for indirect circular reference (A->B->C->A)
    const wouldCreateCycle = await this.wouldCreateCycleAsync(subtaskId, parentTaskId);
    if (wouldCreateCycle) {
      throw new Error('Cannot create dependency: would create circular reference');
    }

    // Check if subtask already has a parent (v1: single level only)
    const existingDependencies = await this.taskDependencyRepository.getDependenciesForTaskAsync(subtaskId);
    if (existingDependencies.length > 0) {
      throw new Error('Task already has a parent - v1 supports only single-level subtasks');
    }

    // Create the dependency
    const dependency = new TaskDependency({
      taskId: subtaskId,
      dependsOnTaskId: parentTaskId,
      dependencyType: EDependencyType.SUBTASK,
    });

    this.unitOfWork.registerNew(dependency.toObject(), 'taskDependency');
    await this.unitOfWork.commit();
  }

  /**
   * Check if creating a dependency would create an indirect cycle
   * e.g., if A depends on B, and we try to add B depends on A, it's a direct cycle
   * e.g., if A depends on B, and we try to add B depends on C where C depends on A, it's indirect
   */
  private async wouldCreateCycleAsync(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    // Check if dependsOnTaskId already depends (directly or indirectly) on taskId
    // This would create: taskId -> dependsOnTaskId -> ... -> taskId
    const visited = new Set<string>();
    const queue: string[] = [dependsOnTaskId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === taskId) {
        return true; // Found a cycle
      }
      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      // Get all tasks that currentId depends on
      const dependencies = await this.taskDependencyRepository.getDependenciesForTaskAsync(currentId);
      for (const dep of dependencies) {
        queue.push(dep.dependsOnTaskId);
      }
    }

    return false;
  }

  /**
   * Remove a subtask from a main task
   */
  async removeSubtaskAsync(subtaskId: string, parentTaskId: string): Promise<boolean> {
    const dependencies = await this.taskDependencyRepository.getDependenciesForTaskAsync(subtaskId);
    const dependency = dependencies.find(d => d.dependsOnTaskId === parentTaskId);

    if (!dependency) {
      return false;
    }

    this.unitOfWork.registerDeleted(dependency, 'taskDependency');
    await this.unitOfWork.commit();
    return true;
  }

  /**
   * Get all subtasks of a main task
   */
  async getSubtasksAsync(parentTaskId: string): Promise<ITaskEntity[]> {
    const dependents = await this.taskDependencyRepository.getDependentsAsync(parentTaskId);
    const subtaskIds = dependents.map(d => d.taskId);
    
    const allTasks = await this.taskRepository.getAllAsync();
    return allTasks.filter(task => subtaskIds.includes(task.id));
  }

  /**
   * Get the parent task of a subtask
   */
  async getParentTaskAsync(subtaskId: string): Promise<ITaskEntity | null> {
    const dependencies = await this.taskDependencyRepository.getDependenciesForTaskAsync(subtaskId);
    
    if (dependencies.length === 0) {
      return null;
    }

    const parentId = dependencies[0].dependsOnTaskId;
    return this.taskRepository.getByIdAsync(parentId);
  }

  /**
   * Check if a main task can be completed (all subtasks must be done)
   */
  async canCompleteMainTaskAsync(taskId: string): Promise<boolean> {
    const subtasks = await this.getSubtasksAsync(taskId);
    
    // If no subtasks, task can be completed
    if (subtasks.length === 0) {
      return true;
    }

    // Check if all subtasks are done
    const allDone = subtasks.every(subtask => subtask.status === EStatus.DONE);
    return allDone;
  }

  /**
   * Check for due date conflicts between a subtask and its parent
   */
  async checkDueDateConflictAsync(subtaskId: string): Promise<DueDateConflictResult> {
    const parentTask = await this.getParentTaskAsync(subtaskId);
    
    if (!parentTask) {
      return { hasConflict: false };
    }

    // If parent has no due date, no conflict
    if (!parentTask.dueDate) {
      return { hasConflict: false };
    }

    const subtask = await this.taskRepository.getByIdAsync(subtaskId);
    if (!subtask || !subtask.dueDate) {
      return { hasConflict: false };
    }

    const subtaskDueDate = new Date(subtask.dueDate);
    const parentDueDate = new Date(parentTask.dueDate);

    if (subtaskDueDate > parentDueDate) {
      const parentDateStr = parentDueDate.toISOString().split('T')[0];
      const subtaskDateStr = subtaskDueDate.toISOString().split('T')[0];
      return {
        hasConflict: true,
        message: `Subtask due date (${subtaskDateStr}) exceeds main task due date (${parentDateStr})`,
        options: {
          adjustSubtask: `Change subtask due date to ${parentDateStr}`,
          extendParent: `Extend main task due date to ${subtaskDateStr}`,
        },
      };
    }

    return { hasConflict: false };
  }

  /**
   * Adjust subtask due date to match parent due date
   */
  async adjustSubtaskDueDateAsync(subtaskId: string): Promise<ITaskEntity | null> {
    const parentTask = await this.getParentTaskAsync(subtaskId);
    if (!parentTask || !parentTask.dueDate) {
      return null;
    }

    const subtask = await this.taskRepository.getByIdAsync(subtaskId);
    if (!subtask) {
      return null;
    }

    const updatedSubtask: ITaskEntity = {
      ...subtask,
      dueDate: parentTask.dueDate,
      updatedAt: new Date().toISOString(),
    };

    this.unitOfWork.registerModified(updatedSubtask, 'task');
    await this.unitOfWork.commit();
    
    return updatedSubtask;
  }

  /**
   * Extend parent task due date to match subtask due date
   */
  async extendParentDueDateAsync(subtaskId: string): Promise<ITaskEntity | null> {
    const subtask = await this.taskRepository.getByIdAsync(subtaskId);
    if (!subtask || !subtask.dueDate) {
      return null;
    }

    const parentTask = await this.getParentTaskAsync(subtaskId);
    if (!parentTask) {
      return null;
    }

    const updatedParent: ITaskEntity = {
      ...parentTask,
      dueDate: subtask.dueDate,
      updatedAt: new Date().toISOString(),
    };

    this.unitOfWork.registerModified(updatedParent, 'task');
    await this.unitOfWork.commit();
    
    return updatedParent;
  }

  /**
   * Delete all dependencies for a task (used when a task is deleted)
   */
  async deleteDependenciesForTaskAsync(taskId: string): Promise<void> {
    // Delete dependencies where task is the subtask
    await this.taskDependencyRepository.deleteByTaskIdAsync(taskId);
    // Delete dependencies where task is the parent
    await this.taskDependencyRepository.deleteByDependsOnTaskIdAsync(taskId);
  }
}
