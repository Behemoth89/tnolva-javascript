import type { EStatus, EPriority } from '../../../enums/index.js';

/**
 * IBllTaskCreateDto Interface
 * BLL-layer DTO for creating new tasks
 * Includes categoryId for category assignment
 */
export interface IBllTaskCreateDto {
  /** Unique identifier for the task (required) */
  id: string;
  /** Title of the task (required, non-empty) */
  title: string;
  /** Detailed description of the task (optional) */
  description?: string;
  /** Initial status of the task (optional, defaults to TODO) */
  status?: EStatus;
  /** Priority level of the task (optional, defaults to MEDIUM) */
  priority?: EPriority;
  /** Start date for the task (optional, defaults to creation timestamp) */
  startDate?: Date;
  /** Due date for the task (optional) */
  dueDate?: Date;
  /** Completion date for the task (optional) */
  completionDate?: Date;
  /** Tags associated with the task (optional) */
  tags?: string[];
  /** Category ID to assign to the task (optional) */
  categoryId?: string;
  /** Indicates whether the task was created by the system (optional, defaults to false) */
  isSystemCreated?: boolean;
  /** Creation timestamp in ISO 8601 format (optional, set by service if not provided) */
  createdAt?: string;
  /** Last update timestamp in ISO 8601 format (optional, set by service if not provided) */
  updatedAt?: string;
}
