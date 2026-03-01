import type { ITaskCategory } from '../../interfaces/ITaskCategory.js';
import type { ITaskCategoryCreateDto } from '../../interfaces/ITaskCategoryCreateDto.js';
import type { ITaskCategoryUpdateDto } from '../../interfaces/ITaskCategoryUpdateDto.js';
import type { ITaskCategoryAssignment } from '../../interfaces/ITaskCategoryAssignment.js';

/**
 * ICategoryService Interface
 * Defines the contract for category business logic operations
 */
export interface ICategoryService {
  /**
   * Create a new category
   * @param dto - Category creation data
   * @returns The created category, or existing category if duplicate name (case-insensitive)
   * @throws Error if name is empty or whitespace
   */
  createAsync(dto: ITaskCategoryCreateDto): Promise<ITaskCategory>;

  /**
   * Update an existing category
   * @param id - Category ID
   * @param dto - Update data
   * @returns The updated category, or null if not found
   * @throws Error if name is set to empty/whitespace
   */
  updateAsync(id: string, dto: ITaskCategoryUpdateDto): Promise<ITaskCategory | null>;

  /**
   * Delete a category
   * @param id - Category ID
   * @returns True if deleted, false if not found
   */
  deleteAsync(id: string): Promise<boolean>;

  /**
   * Get a category by ID
   * @param id - Category ID
   * @returns The category, or null if not found
   */
  getByIdAsync(id: string): Promise<ITaskCategory | null>;

  /**
   * Get all categories
   * @returns Array of all categories
   */
  getAllAsync(): Promise<ITaskCategory[]>;

  /**
   * Get category by name (case-insensitive)
   * @param name - Category name
   * @returns The category, or null if not found
   */
  getByNameAsync(name: string): Promise<ITaskCategory | null>;

  /**
   * Assign a task to a category
   * @param taskId - Task ID
   * @param categoryId - Category ID
   * @returns The created assignment, or null if task/category not found
   */
  assignTaskToCategoryAsync(taskId: string, categoryId: string): Promise<ITaskCategoryAssignment | null>;

  /**
   * Remove a task from a category
   * @param taskId - Task ID
   * @param categoryId - Category ID
   * @returns True if removed, false if not found
   */
  removeTaskFromCategoryAsync(taskId: string, categoryId: string): Promise<boolean>;

  /**
   * Get all categories for a task
   * @param taskId - Task ID
   * @returns Array of categories assigned to the task
   */
  getCategoriesForTaskAsync(taskId: string): Promise<ITaskCategory[]>;

  /**
   * Get all task IDs for a category
   * @param categoryId - Category ID
   * @returns Array of task IDs assigned to the category
   */
  getTasksForCategoryAsync(categoryId: string): Promise<string[]>;
}
