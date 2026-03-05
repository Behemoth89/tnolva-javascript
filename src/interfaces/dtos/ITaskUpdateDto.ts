import type { EStatus, EPriority } from '../../enums/index.js';

/**
 * ITaskUpdateDto Interface
 * Interface for updating existing tasks
 * All fields are optional to allow partial updates
 */
export interface ITaskUpdateDto {
  /** Unique identifier for the task */
  id?: string;
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
  /** Completion date for the task (use null to explicitly clear, omit to keep existing) */
  completionDate?: Date | null;
  /** Tags associated with the task */
  tags?: string[];
  /** Last update timestamp in ISO 8601 format (optional, set by repository if not provided) */
  updatedAt?: string;
}
