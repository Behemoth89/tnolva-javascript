import type { EStatus } from '../enums/EStatus.js';
import type { EPriority } from '../enums/EPriority.js';

/**
 * ITaskCreateDto Interface
 * Interface for creating new tasks
 * Requires id and title, with optional other fields
 */
export interface ITaskCreateDto {
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
  /** Due date for the task (optional) */
  dueDate?: Date;
  /** Tags associated with the task (optional) */
  tags?: string[];
  /** Reference to a recurrence template for repeating tasks (optional) */
  recurrenceTemplateId?: string;
  /** Creation timestamp in ISO 8601 format (optional, set by repository if not provided) */
  createdAt?: string;
  /** Last update timestamp in ISO 8601 format (optional, set by repository if not provided) */
  updatedAt?: string;
}
