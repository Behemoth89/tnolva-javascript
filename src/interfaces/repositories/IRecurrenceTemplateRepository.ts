import type { IRepository } from './IRepository.js';
import type { IRecurrenceTemplateEntity } from '../index.js';

/**
 * IRecurrenceTemplateRepository Interface
 * Extends IRepository with recurrence template-specific operations
 */
export interface IRecurrenceTemplateRepository extends IRepository<IRecurrenceTemplateEntity> {
  /**
   * Initialize repository with default templates if empty
   */
  initialize(): Promise<void>;

  /**
   * Get all templates asynchronously
   */
  getAllAsync(): Promise<IRecurrenceTemplateEntity[]>;

  /**
   * Get template by ID asynchronously
   * @param id - Template ID
   * @returns The template, or null if not found
   */
  getByIdAsync(id: string): Promise<IRecurrenceTemplateEntity | null>;
}
