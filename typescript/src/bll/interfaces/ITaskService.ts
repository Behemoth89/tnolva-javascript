import type { IBllTaskDto, IBllTaskCreateDto, IBllTaskUpdateDto } from '../interfaces/dtos/index.js';
import type { EStatus, EPriority } from '../../enums/index.js';

/**
 * ITaskService Interface
 * Defines the contract for task business logic operations
 * Uses BLL DTOs for input and output
 */
export interface ITaskService {
  /**
   * Create a new task
   * @param dto - Task creation data (BLL DTO)
   * @returns The created task with category info (BLL DTO)
   * @throws Error if title is empty or whitespace
   */
  createAsync(dto: IBllTaskCreateDto): Promise<IBllTaskDto>;

  /**
   * Update an existing task
   * @param id - Task ID
   * @param dto - Update data (BLL DTO)
   * @returns The updated task with category info, or null if not found
   * @throws Error if title is set to empty/whitespace
   */
  updateAsync(id: string, dto: IBllTaskUpdateDto): Promise<IBllTaskDto | null>;

  /**
   * Delete a task
   * @param id - Task ID
   * @returns True if deleted, false if not found
   */
  deleteAsync(id: string): Promise<boolean>;

  /**
   * Get a task by ID
   * @param id - Task ID
   * @returns The task with category info, or null if not found
   */
  getByIdAsync(id: string): Promise<IBllTaskDto | null>;

  /**
   * Get all tasks
   * @returns Array of all tasks with category info
   */
  getAllAsync(): Promise<IBllTaskDto[]>;

  /**
   * Start a TODO task - transitions to IN_PROGRESS
   * @param id - Task ID
   * @returns The updated task, or null if not found or not in TODO status
   */
  startAsync(id: string): Promise<IBllTaskDto | null>;

  /**
   * Complete an IN_PROGRESS task - transitions to DONE
   * @param id - Task ID
   * @returns The updated task, or null if not found or not in IN_PROGRESS status
   */
  completeAsync(id: string): Promise<IBllTaskDto | null>;

  /**
   * Cancel any task - transitions to CANCELLED
   * @param id - Task ID
   * @returns The updated task, or null if not found
   */
  cancelAsync(id: string): Promise<IBllTaskDto | null>;

  /**
   * Add a tag to a task
   * @param id - Task ID
   * @param tag - Tag to add
   * @returns The updated task, or null if not found
   */
  addTagAsync(id: string, tag: string): Promise<IBllTaskDto | null>;

  /**
   * Remove a tag from a task
   * @param id - Task ID
   * @param tag - Tag to remove
   * @returns The updated task, or null if not found
   */
  removeTagAsync(id: string, tag: string): Promise<IBllTaskDto | null>;

  /**
   * Change the priority of a task
   * @param id - Task ID
   * @param priority - New priority
   * @returns The updated task, or null if not found
   */
  changePriorityAsync(id: string, priority: EPriority): Promise<IBllTaskDto | null>;

  /**
   * Get all tasks with a specific status
   * @param status - Status to filter by
   * @returns Array of tasks matching the status with category info
   */
  getByStatusAsync(status: EStatus): Promise<IBllTaskDto[]>;

  /**
   * Get all tasks with a specific priority
   * @param priority - Priority to filter by
   * @returns Array of tasks matching the priority with category info
   */
  getByPriorityAsync(priority: EPriority): Promise<IBllTaskDto[]>;
}
