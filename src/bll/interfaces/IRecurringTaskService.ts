import type { IRecurringTask } from '../../interfaces/IRecurringTask.js';
import type { IRecurringTaskCreateDto } from '../../interfaces/IRecurringTask.js';
import type { IRecurringTaskUpdateDto } from '../../interfaces/IRecurringTask.js';
import type { ITask } from '../../interfaces/ITask.js';
import type { ERecurringTaskStatus } from '../../enums/ERecurringTaskStatus.js';

/**
 * IRecurringTaskService Interface
 * Defines the contract for recurring task business logic operations
 */
export interface IRecurringTaskService {
  /**
   * Create a new recurring task and generate initial task instances
   * @param dto - Recurring task creation data
   * @returns The created recurring task
   * @throws Error if title is empty or intervals are invalid
   */
  createAsync(dto: IRecurringTaskCreateDto): Promise<IRecurringTask>;

  /**
   * Update an existing recurring task and sync linked tasks
   * @param id - Recurring task ID
   * @param dto - Update data
   * @returns The updated recurring task, or null if not found
   * @throws Error if title is set to empty/whitespace
   */
  updateAsync(id: string, dto: IRecurringTaskUpdateDto): Promise<IRecurringTask | null>;

  /**
   * Stop an active recurring task (marks as STOPPED and deletes future linked tasks)
   * @param id - Recurring task ID
   * @returns The updated recurring task, or null if not found
   */
  stopAsync(id: string): Promise<IRecurringTask | null>;

  /**
   * Reactivate a stopped recurring task
   * @param id - Recurring task ID
   * @returns The updated recurring task, or null if not found
   */
  reactivateAsync(id: string): Promise<IRecurringTask | null>;

  /**
   * Get a recurring task by ID
   * @param id - Recurring task ID
   * @returns The recurring task, or null if not found
   */
  getByIdAsync(id: string): Promise<IRecurringTask | null>;

  /**
   * Get all recurring tasks
   * @returns Array of all recurring tasks
   */
  getAllAsync(): Promise<IRecurringTask[]>;

  /**
   * Get all recurring tasks with a specific status
   * @param status - Status to filter by
   * @returns Array of recurring tasks matching the status
   */
  getByStatusAsync(status: ERecurringTaskStatus): Promise<IRecurringTask[]>;

  /**
   * Get all active recurring tasks
   * @returns Array of active recurring tasks
   */
  getActiveAsync(): Promise<IRecurringTask[]>;

  /**
   * Get all tasks linked to a recurring task
   * @param recurringTaskId - Recurring task ID
   * @returns Array of linked tasks
   */
  getLinkedTasksAsync(recurringTaskId: string): Promise<ITask[]>;

  /**
   * Delete a recurring task and all its linked tasks
   * @param id - Recurring task ID
   * @returns True if deleted, false if not found
   */
  deleteAsync(id: string): Promise<boolean>;
}
