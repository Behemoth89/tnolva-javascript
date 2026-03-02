import type { EPriority } from '../enums/EPriority.js';

/**
 * ISubtaskTemplate Interface
 * Defines the structure for subtask templates in recurring tasks
 */
export interface ISubtaskTemplate {
  /** Unique identifier for the subtask template */
  id: string;
  /** Title of the subtask (required) */
  title: string;
  /** Description of the subtask (optional) */
  description?: string;
  /** Priority level - defaults to parent's priority if not specified */
  priority?: EPriority;
  /** Days relative to parent start date (required) */
  startDateOffset: number;
  /** Duration in days (optional - if set, dueDate = startDate + duration) */
  duration?: number;
}

/**
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
