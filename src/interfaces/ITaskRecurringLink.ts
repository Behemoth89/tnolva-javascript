import type { IEntityId } from './IEntityId.js';

/**
 * ITaskRecurringLink Interface
 * Junction table linking task instances to their recurring task source
 * Tracks metadata about the relationship
 */
export interface ITaskRecurringLink extends IEntityId {
  /** ID of the recurring task template */
  recurringTaskId: string;
  /** ID of the generated task instance */
  taskId: string;
  /** The original due date when the task was first generated */
  originalGeneratedDate: Date;
  /** Timestamp of when the task was last regenerated due to recurring task edit */
  lastRegeneratedDate: Date;
}
