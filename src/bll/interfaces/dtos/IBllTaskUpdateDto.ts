import type { EStatus, EPriority } from '../../../enums/index.js';

/**
 * IBllTaskUpdateDto Interface
 * BLL-layer DTO for updating existing tasks
 * Includes categoryId for changing category assignment
 */
export interface IBllTaskUpdateDto {
  /** Title of the task */
  title?: string;
  /** Detailed description of the task */
  description?: string;
  /** Current status of the task */
  status?: EStatus;
  /** Priority level of the task */
  priority?: EPriority;
  /** Start date for the task */
  startDate?: Date;
  /** Due date for the task */
  dueDate?: Date;
  /** Completion date for the task */
  completionDate?: Date;
  /** Tags associated with the task */
  tags?: string[];
  /** Category ID to assign to the task (use null to clear, omit to keep existing) */
  categoryId?: string | null;
  /** Last update timestamp in ISO 8601 format (optional, set by service if not provided) */
  updatedAt?: string;
}
