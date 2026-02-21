import type { IRepository } from './IRepository.js';
import type { Task } from '../domain/Task.js';
import type { EStatus } from '../enums/EStatus.js';
import type { EPriority } from '../enums/EPriority.js';

/**
 * ITaskRepository Interface
 * Extends IRepository<Task> with task-specific query methods
 */
export interface ITaskRepository extends IRepository<Task> {
  /**
   * Get all tasks with a specific status
   * @param status - Status to filter by
   * @returns Array of tasks with the specified status
   */
  getByStatus(status: EStatus): Task[];

  /**
   * Get all tasks with a specific priority
   * @param priority - Priority to filter by
   * @returns Array of tasks with the specified priority
   */
  getByPriority(priority: EPriority): Task[];

  /**
   * Get all tasks with a specific status asynchronously
   * @param status - Status to filter by
   * @returns Promise resolving to array of tasks
   */
  getByStatusAsync(status: EStatus): Promise<Task[]>;

  /**
   * Get all tasks with a specific priority asynchronously
   * @param priority - Priority to filter by
   * @returns Promise resolving to array of tasks
   */
  getByPriorityAsync(priority: EPriority): Promise<Task[]>;
}
