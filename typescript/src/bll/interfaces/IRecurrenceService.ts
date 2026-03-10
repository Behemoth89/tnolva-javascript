import type { ITaskEntity, IRecurrenceTemplateEntity } from '../../interfaces/index.js';
import type { IBllTaskDto } from './dtos/index.js';

/**
 * IRecurrenceService Interface
 * Defines the contract for recurrence business logic operations
 */
export interface IRecurrenceService {
  /**
   * Initialize the recurrence service, loading default templates
   */
  initializeAsync(): Promise<void>;

  /**
   * Get all recurrence templates
   * @returns Array of all recurrence templates
   */
  getAllTemplatesAsync(): Promise<IRecurrenceTemplateEntity[]>;

  /**
   * Get a recurrence template by ID
   * @param id - Template ID
   * @returns The template, or null if not found
   */
  getTemplateByIdAsync(id: string): Promise<IRecurrenceTemplateEntity | null>;

  /**
   * Calculate the next occurrence date for a template
   * @param template - The recurrence template
   * @param currentDate - The base date to calculate from
   * @returns The next occurrence date
   * @throws Error if interval values are invalid
   */
  calculateNextOccurrenceAsync(template: IRecurrenceTemplateEntity, currentDate: Date): Promise<Date>;

  /**
   * Generate the next task instance from a completed recurring task
   * @param completedTask - The completed task
   * @returns The new generated task as IBllTaskDto, or null if no recurrence template
   */
  generateNextTaskAsync(completedTask: ITaskEntity): Promise<IBllTaskDto | null>;

  /**
   * Check if a task can generate a next instance
   * @param task - The task to check
   * @returns true if the task has a recurrence template
   */
  canGenerateNextInstance(task: ITaskEntity): boolean;

  /**
   * Create a new recurrence template
   * @param template - The template to create
   * @returns The created template
   */
  createTemplateAsync(template: IRecurrenceTemplateEntity): Promise<IRecurrenceTemplateEntity>;

  /**
   * Update an existing recurrence template
   * @param id - Template ID
   * @param updates - Partial template with updates
   * @returns The updated template, or null if not found
   */
  updateTemplateAsync(id: string, updates: Partial<IRecurrenceTemplateEntity>): Promise<IRecurrenceTemplateEntity | null>;

  /**
   * Delete a recurrence template
   * @param id - Template ID
   * @returns True if deleted, false if not found
   */
  deleteTemplateAsync(id: string): Promise<boolean>;
}
