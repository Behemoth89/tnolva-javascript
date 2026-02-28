import type { IRepository } from './IRepository.js';
import type { ITaskCategory } from './ITaskCategory.js';
import type { ITaskCategoryAssignment } from './ITaskCategoryAssignment.js';

/**
 * ICategoryRepository Interface
 * Extends IRepository with category-specific operations including assignments
 */
export interface ICategoryRepository extends IRepository<ITaskCategory> {
  /**
   * Assign a task to a category
   * @param taskId - ID of the task
   * @param categoryId - ID of the category
   * @returns The created assignment, or null if failed
   */
  assignTaskToCategory(taskId: string, categoryId: string): Promise<ITaskCategoryAssignment | null>;

  /**
   * Remove a task from a category
   * @param taskId - ID of the task
   * @param categoryId - ID of the category
   * @returns True if removed, false if not found
   */
  removeTaskFromCategory(taskId: string, categoryId: string): Promise<boolean>;

  /**
   * Get all categories for a task
   * @param taskId - ID of the task
   * @returns Array of categories assigned to the task
   */
  getCategoriesForTask(taskId: string): Promise<ITaskCategory[]>;

  /**
   * Get all tasks for a category
   * @param categoryId - ID of the category
   * @returns Array of task IDs assigned to the category
   */
  getTasksForCategory(categoryId: string): Promise<string[]>;

  /**
   * Get category by name
   * @param name - Name of the category
   * @returns The category if found, null otherwise
   */
  getByName(name: string): Promise<ITaskCategory | null>;
}
