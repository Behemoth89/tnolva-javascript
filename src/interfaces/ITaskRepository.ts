import type { IRepository } from './IRepository.js';
import type { ITask } from './ITask.js';
import type { EStatus } from '../enums/EStatus.js';
import type { EPriority } from '../enums/EPriority.js';

/**
 * ITaskRepository Interface
 * Extends IRepository<ITask> with task-specific query methods
 */
export interface ITaskRepository extends IRepository<ITask> {
  /**
   * Get all tasks with a specific status
   * @param status - Status to filter by
   * @returns Array of tasks with the specified status
   */
  getByStatus(status: EStatus): ITask[];

  /**
   * Get all tasks with a specific priority
   * @param priority - Priority to filter by
   * @returns Array of tasks with the specified priority
   */
  getByPriority(priority: EPriority): ITask[];

  /**
   * Get all tasks with a specific status asynchronously
   * @param status - Status to filter by
   * @returns Promise resolving to array of tasks
   */
  getByStatusAsync(status: EStatus): Promise<ITask[]>;

  /**
   * Get all tasks with a specific priority asynchronously
   * @param priority - Priority to filter by
   * @returns Promise resolving to array of tasks
   */
  getByPriorityAsync(priority: EPriority): Promise<ITask[]>;
}
