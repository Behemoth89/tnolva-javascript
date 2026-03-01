import type { ITaskRecurringLink } from '../interfaces/ITaskRecurringLink.js';
import { generateGuid } from '../utils/index.js';

/**
 * TaskRecurringLink Domain Class - Junction table entry
 * Represents the relationship between a task instance and its recurring task source
 */
export class TaskRecurringLink implements ITaskRecurringLink {
  id: string;
  recurringTaskId: string;
  taskId: string;
  originalGeneratedDate: Date;
  lastRegeneratedDate: Date;

  /**
   * Creates a new TaskRecurringLink instance
   * @param recurringTaskId - ID of the recurring task template
   * @param taskId - ID of the generated task instance
   * @param originalGeneratedDate - The original due date when first generated
   */
  constructor(
    recurringTaskId: string,
    taskId: string,
    originalGeneratedDate: Date
  ) {
    this.id = generateGuid();
    this.recurringTaskId = recurringTaskId;
    this.taskId = taskId;
    this.originalGeneratedDate = originalGeneratedDate;
    this.lastRegeneratedDate = new Date();
  }

  /**
   * Create a TaskRecurringLink from an existing ITaskRecurringLink object
   * @param existing - Existing ITaskRecurringLink object
   */
  static fromExisting(existing: ITaskRecurringLink): TaskRecurringLink {
    const link = new TaskRecurringLink(
      existing.recurringTaskId,
      existing.taskId,
      existing.originalGeneratedDate
    );
    link.id = existing.id;
    link.lastRegeneratedDate = existing.lastRegeneratedDate;
    return link;
  }

  /**
   * Convert to plain object
   * @returns Plain object representation
   */
  toObject(): ITaskRecurringLink {
    return {
      id: this.id,
      recurringTaskId: this.recurringTaskId,
      taskId: this.taskId,
      originalGeneratedDate: this.originalGeneratedDate,
      lastRegeneratedDate: this.lastRegeneratedDate,
    };
  }

  /**
   * Update the last regenerated date to current time
   */
  markRegenerated(): void {
    this.lastRegeneratedDate = new Date();
  }

  /**
   * Check if this link is for the given recurring task
   * @param recurringTaskId - The recurring task ID to check
   * @returns true if this link is for the given recurring task
   */
  isForRecurringTask(recurringTaskId: string): boolean {
    return this.recurringTaskId === recurringTaskId;
  }

  /**
   * Check if this link is for the given task
   * @param taskId - The task ID to check
   * @returns true if this link is for the given task
   */
  isForTask(taskId: string): boolean {
    return this.taskId === taskId;
  }
}
