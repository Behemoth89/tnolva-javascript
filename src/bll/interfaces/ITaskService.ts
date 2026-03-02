import type { ITaskEntity, ITaskCreateDto, ITaskUpdateDto } from '../../interfaces/index.js';
import type { EStatus, EPriority } from '../../enums/index.js';

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
  createAsync(dto: ITaskCreateDto): Promise<ITaskEntity>;

  /**
   * Update an existing task
   * @param id - Task ID
   * @param dto - Update data
   * @returns The updated task, or null if not found
   * @throws Error if title is set to empty/whitespace
   */
  updateAsync(id: string, dto: ITaskUpdateDto): Promise<ITaskEntity | null>;

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
  getByIdAsync(id: string): Promise<ITaskEntity | null>;

  /**
   * Get all tasks
   * @returns Array of all tasks
   */
  getAllAsync(): Promise<ITaskEntity[]>;

  /**
   * Start a TODO task - transitions to IN_PROGRESS
   * @param id - Task ID
   * @returns The updated task, or null if not found or not in TODO status
   */
  startAsync(id: string): Promise<ITaskEntity | null>;

  /**
   * Complete an IN_PROGRESS task - transitions to DONE
   * @param id - Task ID
   * @returns The updated task, or null if not found or not in IN_PROGRESS status
   */
  completeAsync(id: string): Promise<ITaskEntity | null>;

  /**
   * Cancel any task - transitions to CANCELLED
   * @param id - Task ID
   * @returns The updated task, or null if not found
   */
  cancelAsync(id: string): Promise<ITaskEntity | null>;

  /**
   * Add a tag to a task
   * @param id - Task ID
   * @param tag - Tag to add
   * @returns The updated task, or null if not found
   */
  addTagAsync(id: string, tag: string): Promise<ITaskEntity | null>;

  /**
   * Remove a tag from a task
   * @param id - Task ID
   * @param tag - Tag to remove
   * @returns The updated task, or null if not found
   */
  removeTagAsync(id: string, tag: string): Promise<ITaskEntity | null>;

  /**
   * Change the priority of a task
   * @param id - Task ID
   * @param priority - New priority
   * @returns The updated task, or null if not found
   */
  changePriorityAsync(id: string, priority: EPriority): Promise<ITaskEntity | null>;

  /**
   * Get all tasks with a specific status
   * @param status - Status to filter by
   * @returns Array of tasks matching the status
   */
  getByStatusAsync(status: EStatus): Promise<ITaskEntity[]>;

  /**
   * Get all tasks with a specific priority
   * @param priority - Priority to filter by
   * @returns Array of tasks matching the priority
   */
  getByPriorityAsync(priority: EPriority): Promise<ITaskEntity[]>;
}
