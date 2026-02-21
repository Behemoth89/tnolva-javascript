import type { EStatus } from '../enums/EStatus.js';
import type { EPriority } from '../enums/EPriority.js';

/**
 * ITask Interface
 * Defines the structure for task objects
 */
export interface ITask {
  /** Unique identifier for the task */
  id: string;
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
