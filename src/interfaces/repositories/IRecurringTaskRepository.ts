import type { IRepository } from './IRepository.js';
import type { IRecurringTaskEntity } from '../entities/IRecurringTaskEntity.js';
import type { ERecurringTaskStatus } from '../../enums/ERecurringTaskStatus.js';

/**
 * IRecurringTaskRepository Interface
 * Extends generic IRepository for recurring task operations
 */
export interface IRecurringTaskRepository extends IRepository<IRecurringTaskEntity> {
  /**
   * Get all recurring tasks with a specific status
   * @param status - The status to filter by
   * @returns Array of recurring tasks with the specified status
   */
  getByStatus(status: ERecurringTaskStatus): IRecurringTaskEntity[];

  /**
   * Get all recurring tasks with a specific status asynchronously
   * @param status - The status to filter by
   * @returns Promise resolving to array of recurring tasks
   */
  getByStatusAsync(status: ERecurringTaskStatus): Promise<IRecurringTaskEntity[]>;

  /**
   * Get all active recurring tasks (status = ACTIVE)
   * @returns Array of active recurring tasks
   */
  getActive(): IRecurringTaskEntity[];

  /**
   * Get all active recurring tasks asynchronously
   * @returns Promise resolving to array of active recurring tasks
   */
  getActiveAsync(): Promise<IRecurringTaskEntity[]>;
}
