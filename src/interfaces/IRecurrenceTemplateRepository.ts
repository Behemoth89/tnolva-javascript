import type { IRepository } from './IRepository.js';
import type { IRecurrenceTemplate } from './IRecurrenceTemplate.js';

/**
 * IRecurrenceTemplateRepository Interface
 * Extends IRepository with recurrence template-specific operations
 */
export interface IRecurrenceTemplateRepository extends IRepository<IRecurrenceTemplate> {
  /**
   * Initialize repository with default templates if empty
   */
  initialize(): Promise<void>;

  /**
   * Get all templates asynchronously
   */
  getAllAsync(): Promise<IRecurrenceTemplate[]>;

  /**
   * Get template by ID asynchronously
   * @param id - Template ID
   * @returns The template, or null if not found
   */
  getByIdAsync(id: string): Promise<IRecurrenceTemplate | null>;
}
