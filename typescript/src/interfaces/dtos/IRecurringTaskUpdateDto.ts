import type { IInterval } from '../index.js';
import type { EPriority, ERecurringTaskStatus } from '../../enums/index.js';

/**
 * IRecurringTaskUpdateDto Interface
 * Data transfer object for updating a recurring task
 */
export interface IRecurringTaskUpdateDto {
  /** Title of the recurring task */
  title?: string;
  /** Detailed description */
  description?: string;
  /** Priority level */
  priority?: EPriority;
  /** Start date for generating tasks */
  startDate?: Date;
  /** End date for generating tasks */
  endDate?: Date;
  /** Array of interval components */
  intervals?: IInterval[];
  /** Tags for generated tasks */
  tags?: string[];
  /** Category IDs for generated tasks */
  categoryIds?: string[];
  /** Status of the recurring task */
  status?: ERecurringTaskStatus;
  /** ID of the recurrence template used by this recurring task */
  recurrenceTemplateId?: string;
}
