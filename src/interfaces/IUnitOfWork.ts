import type { ITaskRepository } from './ITaskRepository.js';
import type { ICategoryRepository } from './ICategoryRepository.js';
import type { ITaskCategoryAssignment } from './ITaskCategoryAssignment.js';

/**
 * IUnitOfWork Interface
 * Coordinates multiple repository operations within a single transaction scope
 */
export interface IUnitOfWork {
  /**
   * Get the Task repository
   */
  getTaskRepository(): ITaskRepository;

  /**
   * Get the Category repository
   */
  getCategoryRepository(): ICategoryRepository;

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
   * Register a new entity for insertion on commit
   * @param entity - Entity to register
   */
  registerNew(entity: unknown): void;

  /**
   * Register a modified entity for update on commit
   * @param entity - Entity to register
   */
  registerModified(entity: unknown): void;

  /**
   * Register a deleted entity for deletion on commit
   * @param entity - Entity to register
   */
  registerDeleted(entity: unknown): void;

  /**
   * Commit all registered changes to storage atomically
   */
  commit(): Promise<void>;

  /**
   * Discard all registered changes without modifying storage
   */
  rollback(): void;
}
