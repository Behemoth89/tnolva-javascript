import type { ITask } from '../../interfaces/ITask.js';

/**
 * Result type for due date conflict check
 */
export interface DueDateConflictResult {
  /** Whether there is a conflict */
  hasConflict: boolean;
  /** Warning message if there is a conflict */
  message?: string;
  /** Options for resolving the conflict */
  options?: {
    adjustSubtask: string;
    extendParent: string;
  };
}

/**
 * ITaskDependencyService Interface
 * Defines business logic operations for task dependencies
 */
export interface ITaskDependencyService {
  /**
   * Add a subtask to a main task
   * @param subtaskId - The subtask ID
   * @param parentTaskId - The parent/main task ID
   * @throws Error if circular reference detected or subtask already has a parent
   */
  addSubtaskAsync(subtaskId: string, parentTaskId: string): Promise<void>;

  /**
   * Remove a subtask from a main task
   * @param subtaskId - The subtask ID
   * @param parentTaskId - The parent/main task ID
   */
  removeSubtaskAsync(subtaskId: string, parentTaskId: string): Promise<boolean>;

  /**
   * Get all subtasks of a main task
   * @param parentTaskId - The parent/main task ID
   * @returns Array of subtask ITask objects
   */
  getSubtasksAsync(parentTaskId: string): Promise<ITask[]>;

  /**
   * Get the parent task of a subtask
   * @param subtaskId - The subtask ID
   * @returns The parent task or null if not found
   */
  getParentTaskAsync(subtaskId: string): Promise<ITask | null>;

  /**
   * Check if a main task can be completed (all subtasks must be done)
   * @param taskId - The task ID to check
   * @returns true if all subtasks are done or task has no subtasks
   */
  canCompleteMainTaskAsync(taskId: string): Promise<boolean>;

  /**
   * Check for due date conflicts between a subtask and its parent
   * @param subtaskId - The subtask ID
   * @returns Result indicating if there's a conflict and options to resolve
   */
  checkDueDateConflictAsync(subtaskId: string): Promise<DueDateConflictResult>;

  /**
   * Adjust subtask due date to match parent due date
   * @param subtaskId - The subtask ID
   */
  adjustSubtaskDueDateAsync(subtaskId: string): Promise<ITask | null>;

  /**
   * Extend parent task due date to match subtask due date
   * @param subtaskId - The subtask ID
   */
  extendParentDueDateAsync(subtaskId: string): Promise<ITask | null>;

  /**
   * Delete all dependencies for a task (used when a task is deleted)
   * @param taskId - The task ID
   */
  deleteDependenciesForTaskAsync(taskId: string): Promise<void>;
}
