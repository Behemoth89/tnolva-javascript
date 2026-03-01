import type { ITask } from '../../interfaces/ITask.js';
import type { ITaskCreateDto } from '../../interfaces/ITaskCreateDto.js';
import type { ITaskUpdateDto } from '../../interfaces/ITaskUpdateDto.js';
import type { EStatus } from '../../enums/EStatus.js';
import type { EPriority } from '../../enums/EPriority.js';

/**
 * ITaskService Interface
 * Defines the contract for task business logic operations
 */
export interface ITaskService {
  /**
   * Create a new task
   * @param dto - Task creation data
   * @returns The created task
   * @throws Error if title is empty or whitespace
   */
  createAsync(dto: ITaskCreateDto): Promise<ITask>;

  /**
   * Update an existing task
   * @param id - Task ID
   * @param dto - Update data
   * @returns The updated task, or null if not found
   * @throws Error if title is set to empty/whitespace
   */
  updateAsync(id: string, dto: ITaskUpdateDto): Promise<ITask | null>;

  /**
   * Delete a task
   * @param id - Task ID
   * @returns True if deleted, false if not found
   */
  deleteAsync(id: string): Promise<boolean>;

  /**
   * Get a task by ID
   * @param id - Task ID
   * @returns The task, or null if not found
   */
  getByIdAsync(id: string): Promise<ITask | null>;

  /**
   * Get all tasks
   * @returns Array of all tasks
   */
  getAllAsync(): Promise<ITask[]>;

  /**
   * Start a TODO task - transitions to IN_PROGRESS
   * @param id - Task ID
   * @returns The updated task, or null if not found or not in TODO status
   */
  startAsync(id: string): Promise<ITask | null>;

  /**
   * Complete an IN_PROGRESS task - transitions to DONE
   * @param id - Task ID
   * @returns The updated task, or null if not found or not in IN_PROGRESS status
   */
  completeAsync(id: string): Promise<ITask | null>;

  /**
   * Cancel any task - transitions to CANCELLED
   * @param id - Task ID
   * @returns The updated task, or null if not found
   */
  cancelAsync(id: string): Promise<ITask | null>;

  /**
   * Add a tag to a task
   * @param id - Task ID
   * @param tag - Tag to add
   * @returns The updated task, or null if not found
   */
  addTagAsync(id: string, tag: string): Promise<ITask | null>;

  /**
   * Remove a tag from a task
   * @param id - Task ID
   * @param tag - Tag to remove
   * @returns The updated task, or null if not found
   */
  removeTagAsync(id: string, tag: string): Promise<ITask | null>;

  /**
   * Change the priority of a task
   * @param id - Task ID
   * @param priority - New priority
   * @returns The updated task, or null if not found
   */
  changePriorityAsync(id: string, priority: EPriority): Promise<ITask | null>;

  /**
   * Get all tasks with a specific status
   * @param status - Status to filter by
   * @returns Array of tasks matching the status
   */
  getByStatusAsync(status: EStatus): Promise<ITask[]>;

  /**
   * Get all tasks with a specific priority
   * @param priority - Priority to filter by
   * @returns Array of tasks matching the priority
   */
  getByPriorityAsync(priority: EPriority): Promise<ITask[]>;
}
