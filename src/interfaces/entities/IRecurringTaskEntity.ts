import type { IBaseEntity, IInterval } from '../index.js';
import type { EPriority } from '../../enums/EPriority.js';
import type { ERecurringTaskStatus } from '../../enums/ERecurringTaskStatus.js';

/**
 * IRecurringTaskEntity Interface
 * Defines the structure for recurring task objects
 * A recurring task is a template that generates task instances
 */
export interface IRecurringTaskEntity extends IBaseEntity {
  /** Title of the recurring task (required, non-empty) */
  title: string;
  /** Detailed description of the recurring task (optional) */
  description?: string;
  /** Priority level for generated tasks */
  priority: EPriority;
  /** Start date for generating tasks */
  startDate: Date;
  /** End date for generating tasks (optional - indefinite if not set) */
  endDate?: Date;
  /** Array of interval components that define the recurrence pattern */
  intervals: IInterval[];
  /** Tags associated with generated tasks (optional) */
  tags?: string[];
  /** Category IDs to assign to generated tasks (optional) */
  categoryIds?: string[];
  /** Current status of the recurring task */
  status: ERecurringTaskStatus;
  /** ID of the recurrence template used by this recurring task */
  recurrenceTemplateId: string;
}
