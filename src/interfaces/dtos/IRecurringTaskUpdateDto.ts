import type { IInterval } from '../entities/IInterval.js';
import type { EPriority } from '../../enums/EPriority.js';
import type { ERecurringTaskStatus } from '../../enums/ERecurringTaskStatus.js';

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
}
