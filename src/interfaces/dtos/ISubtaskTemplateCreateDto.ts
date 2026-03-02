import type { EPriority } from '../../enums/index.js';

/**
 * ISubtaskTemplateCreateDto Interface
 * Data transfer object for creating a subtask template
 */
export interface ISubtaskTemplateCreateDto {
  /** Title of the subtask (required) */
  title: string;
  /** Description of the subtask (optional) */
  description?: string;
  /** Priority level (optional, defaults to parent) */
  priority?: EPriority;
  /** Days relative to parent start date (required) */
  startDateOffset: number;
  /** Duration in days (optional) */
  duration?: number;
}
