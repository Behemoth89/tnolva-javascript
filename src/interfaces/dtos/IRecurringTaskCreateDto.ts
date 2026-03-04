import type { IInterval } from '../index.js';
import type { EPriority } from '../../enums/index.js';

/**
 * IRecurringTaskCreateDto Interface
 * Data transfer object for creating a recurring task
 */
export interface IRecurringTaskCreateDto {
  /** Title of the recurring task (required) */
  title: string;
  /** Detailed description (optional) */
  description?: string;
  /** Priority level (defaults to MEDIUM) */
  priority?: EPriority;
  /** Start date for generating tasks (required) */
  startDate: Date;
  /** End date for generating tasks (optional - indefinite if not set) */
  endDate?: Date;
  /** Array of interval components (required) */
  intervals: IInterval[];
  /** Tags for generated tasks (optional) */
  tags?: string[];
  /** Category IDs for generated tasks (optional) */
  categoryIds?: string[];
  /** ID of the recurrence template used by this recurring task (required) */
  recurrenceTemplateId: string;
}
