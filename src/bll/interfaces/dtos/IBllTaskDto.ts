import type { EStatus, EPriority } from '../../../enums/index.js';

/**
 * IBllTaskDto Interface
 * BLL-layer DTO for task display
 * Includes category information for UI display
 */
export interface IBllTaskDto {
  /** Unique identifier for the task */
  id: string;
  /** Title of the task */
  title: string;
  /** Detailed description of the task */
  description?: string;
  /** Current status of the task */
  status: EStatus;
  /** Priority level of the task */
  priority: EPriority;
  /** Start date for the task */
  startDate: Date;
  /** Due date for the task */
  dueDate?: Date;
  /** Tags associated with the task */
  tags?: string[];
  /** Category ID assigned to the task */
  categoryId?: string;
  /** Category name (populated from category junction table) */
  categoryName?: string;
  /** Category color (populated from category junction table) */
  categoryColor?: string;
  /** Indicates whether the task was created by the system */
  isSystemCreated?: boolean;
  /** Creation timestamp in ISO 8601 format */
  createdAt: string;
  /** Last update timestamp in ISO 8601 format */
  updatedAt: string;
}
