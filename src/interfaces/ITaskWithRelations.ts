import type { ITask } from './ITask.js';

/**
 * ITaskWithRelations Interface
 * Interface for task with relationship properties
 * Extends ITask with optional project, assignee, and creator references
 */
export interface ITaskWithRelations extends ITask {
  /** Optional project ID this task belongs to */
  projectId?: string;
  /** Optional user ID assigned to this task */
  assigneeId?: string;
  /** User ID who created this task (required) */
  creatorId: string;
}
