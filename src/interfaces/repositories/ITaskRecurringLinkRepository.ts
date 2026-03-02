import type { IRepository } from './IRepository.js';
import type { ITaskRecurringLinkEntity } from '../index.js';

/**
 * ITaskRecurringLinkRepository Interface
 * Repository interface for junction table operations
 */
export interface ITaskRecurringLinkRepository extends IRepository<ITaskRecurringLinkEntity> {
  /**
   * Get all links for a specific recurring task
   * @param recurringTaskId - The recurring task ID
   * @returns Array of links
   */
  getByRecurringTaskId(recurringTaskId: string): ITaskRecurringLinkEntity[];

  /**
   * Get all links for a specific recurring task asynchronously
   * @param recurringTaskId - The recurring task ID
   * @returns Promise resolving to array of links
   */
  getByRecurringTaskIdAsync(recurringTaskId: string): Promise<ITaskRecurringLinkEntity[]>;

  /**
   * Get all links for a specific task
   * @param taskId - The task ID
   * @returns Array of links
   */
  getByTaskId(taskId: string): ITaskRecurringLinkEntity[];

  /**
   * Get all links for a specific task asynchronously
   * @param taskId - The task ID
   * @returns Promise resolving to array of links
   */
  getByTaskIdAsync(taskId: string): Promise<ITaskRecurringLinkEntity[]>;

  /**
   * Get link by both IDs
   * @param recurringTaskId - The recurring task ID
   * @param taskId - The task ID
   * @returns Link or null
   */
  getByBothIds(recurringTaskId: string, taskId: string): ITaskRecurringLinkEntity | null;

  /**
   * Get link by both IDs asynchronously
   * @param recurringTaskId - The recurring task ID
   * @param taskId - The task ID
   * @returns Promise resolving to link or null
   */
  getByBothIdsAsync(recurringTaskId: string, taskId: string): Promise<ITaskRecurringLinkEntity | null>;

  /**
   * Delete links by recurring task ID
   * @param recurringTaskId - The recurring task ID
   * @returns Number of deleted links
   */
  deleteByRecurringTaskIdAsync(recurringTaskId: string): Promise<number>;

  /**
   * Delete links by task ID
   * @param taskId - The task ID
   * @returns Number of deleted links
   */
  deleteByTaskIdAsync(taskId: string): Promise<number>;
}
