import type { IBaseEntity } from './IBaseEntity.js';
import type { IInterval } from './IInterval.js';
import type { EPriority } from '../enums/EPriority.js';
import type { ERecurringTaskStatus } from '../enums/ERecurringTaskStatus.js';

/**
 * IRecurringTask Interface
 * Defines the structure for recurring task objects
 * A recurring task is a template that generates task instances
 */
export interface IRecurringTask extends IBaseEntity {
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
}

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
}

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
