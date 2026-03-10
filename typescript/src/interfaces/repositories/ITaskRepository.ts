import type { IRepository } from './IRepository.js';
import type { ITaskEntity } from '../index.js';
import type { EStatus, EPriority } from '../../enums/index.js';

/**
 * ITaskRepository Interface
 * Extends IRepository<ITaskEntity> with task-specific query methods
 */
export interface ITaskRepository extends IRepository<ITaskEntity> {
  /**
   * Get all tasks with a specific status
   * @param status - Status to filter by
   * @returns Array of tasks with the specified status
   */
  getByStatus(status: EStatus): ITaskEntity[];

  /**
   * Get all tasks with a specific priority
   * @param priority - Priority to filter by
   * @returns Array of tasks with the specified priority
   */
  getByPriority(priority: EPriority): ITaskEntity[];

  /**
   * Get all tasks with a specific status asynchronously
   * @param status - Status to filter by
   * @returns Promise resolving to array of tasks
   */
  getByStatusAsync(status: EStatus): Promise<ITaskEntity[]>;

  /**
   * Get all tasks with a specific priority asynchronously
   * @param priority - Priority to filter by
   * @returns Promise resolving to array of tasks
   */
  getByPriorityAsync(priority: EPriority): Promise<ITaskEntity[]>;
}
