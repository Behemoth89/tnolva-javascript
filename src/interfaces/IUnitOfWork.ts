import type { ITaskRepository } from './ITaskRepository.js';
import type { ICategoryRepository } from './ICategoryRepository.js';
import type { ITaskCategoryAssignment } from './ITaskCategoryAssignment.js';
import type { IEntityId } from './IEntityId.js';
import type { ITask } from './ITask.js';
import type { IRecurrenceTemplateRepository } from './IRecurrenceTemplateRepository.js';
import type { IRecurringTaskRepository } from './IRecurringTaskRepository.js';
import type { ITaskRecurringLinkRepository } from './ITaskRecurringLinkRepository.js';

/**
 * Entity type for routing changes to the correct repository
 */
export type EntityType = 'task' | 'category' | 'recurrenceTemplate' | 'recurringTask' | 'taskRecurringLink';

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
   * Get the RecurrenceTemplate repository
   */
  getRecurrenceTemplateRepository(): IRecurrenceTemplateRepository;

  /**
   * Get the RecurringTask repository
   */
  getRecurringTaskRepository(): IRecurringTaskRepository;

  /**
   * Get the TaskRecurringLink repository
   */
  getTaskRecurringLinkRepository(): ITaskRecurringLinkRepository;

  /**
   * Initialize the UnitOfWork, including loading default data
   */
  initialize(): Promise<void>;

  /**
   * Complete a task with optional recurrence generation
   * @param taskId - ID of the task to complete
   * @returns The newly generated task if recurrence was created, null otherwise
   */
  completeTaskWithRecurrence(taskId: string): Promise<ITask | null>;

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
   * @param entity - Entity to register (must extend IEntityId)
   * @param entityType - Type of entity for routing to correct repository
   */
  registerNew<T extends IEntityId>(entity: T, entityType: EntityType): void;

  /**
   * Register a modified entity for update on commit
   * @param entity - Entity to register (must extend IEntityId)
   * @param entityType - Type of entity for routing to correct repository
   */
  registerModified<T extends IEntityId>(entity: T, entityType: EntityType): void;

  /**
   * Register a deleted entity for deletion on commit
   * @param entity - Entity to register (must extend IEntityId)
   * @param entityType - Type of entity for routing to correct repository
   */
  registerDeleted<T extends IEntityId>(entity: T, entityType: EntityType): void;

  /**
   * Commit all registered changes to storage atomically
   */
  commit(): Promise<void>;

  /**
   * Discard all registered changes without modifying storage
   */
  rollback(): void;
}
