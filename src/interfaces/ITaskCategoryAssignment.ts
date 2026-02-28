import type { IBaseEntity } from './IBaseEntity.js';

/**
 * ITaskCategoryAssignment Interface
 * Defines the junction table structure for many-to-many task-category relationship
 * Extends IBaseEntity for timestamp support
 */
export interface ITaskCategoryAssignment extends IBaseEntity {
  /** ID of the task */
  taskId: string;
  /** ID of the category */
  categoryId: string;
  /** Timestamp when the task was assigned to the category */
  assignedAt: string;
}
