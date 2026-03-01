import type { IRepository } from './IRepository.js';
import type { IRecurringTask } from './IRecurringTask.js';
import type { ERecurringTaskStatus } from '../enums/ERecurringTaskStatus.js';

/**
 * IRecurringTaskRepository Interface
 * Extends generic IRepository for recurring task operations
 */
export interface IRecurringTaskRepository extends IRepository<IRecurringTask> {
  /**
   * Get all recurring tasks with a specific status
   * @param status - The status to filter by
   * @returns Array of recurring tasks with the specified status
   */
  getByStatus(status: ERecurringTaskStatus): IRecurringTask[];

  /**
   * Get all recurring tasks with a specific status asynchronously
   * @param status - The status to filter by
   * @returns Promise resolving to array of recurring tasks
   */
  getByStatusAsync(status: ERecurringTaskStatus): Promise<IRecurringTask[]>;

  /**
   * Get all active recurring tasks (status = ACTIVE)
   * @returns Array of active recurring tasks
   */
  getActive(): IRecurringTask[];

  /**
   * Get all active recurring tasks asynchronously
   * @returns Promise resolving to array of active recurring tasks
   */
  getActiveAsync(): Promise<IRecurringTask[]>;
}
