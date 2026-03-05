import type { EStatus } from '../../enums/EStatus.js';
import type { EPriority } from '../../enums/EPriority.js';
import type { IBaseEntity } from '../index.js';

/**
 * ITaskEntity Interface
 * Defines the structure for task objects
 * Extends IBaseEntity for timestamp support
 */
export interface ITaskEntity extends IBaseEntity {
  /** Title of the task (required, non-empty) */
  title: string;
  /** Detailed description of the task (optional) */
  description?: string;
  /** Current status of the task */
  status: EStatus;
  /** Priority level of the task */
  priority: EPriority;
  /** Start date for the task (required, defaults to creation timestamp) */
  startDate: Date;
  /** Due date for the task (optional) */
  dueDate?: Date;
  /** Completion date for the task (optional, set when task is marked as DONE) */
  completionDate?: Date;
  /** Tags associated with the task (optional) */
  tags?: string[];
  /** Indicates whether the task was created by the system (e.g., recurring task generator) */
  isSystemCreated?: boolean;
}
