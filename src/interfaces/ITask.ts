import type { EStatus } from '../enums/EStatus.js';
import type { EPriority } from '../enums/EPriority.js';
import type { IBaseEntity } from './IBaseEntity.js';

/**
 * ITask Interface
 * Defines the structure for task objects
 * Extends IBaseEntity for timestamp support
 */
export interface ITask extends IBaseEntity {
  /** Title of the task (required, non-empty) */
  title: string;
  /** Detailed description of the task (optional) */
  description?: string;
  /** Current status of the task */
  status: EStatus;
  /** Priority level of the task */
  priority: EPriority;
  /** Due date for the task (optional) */
  dueDate?: Date;
  /** Tags associated with the task (optional) */
  tags?: string[];
}
