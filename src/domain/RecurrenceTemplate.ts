import type { IRecurrenceTemplate } from '../interfaces/IRecurrenceTemplate.js';
import type { IInterval } from '../interfaces/IInterval.js';

/**
 * RecurrenceTemplate Entity Class
 * Implements IRecurrenceTemplate and provides domain logic for recurrence templates
 */
export class RecurrenceTemplate implements IRecurrenceTemplate {
  id: string;
  name: string;
  intervals: IInterval[];
  dayOfMonth?: number;
  weekday?: number;
  occurrenceInMonth?: number;

  /**
   * Creates a new RecurrenceTemplate instance
   * @param template - Recurrence template data
   * @throws Error if required fields are missing or invalid
   */
  constructor(template: IRecurrenceTemplate) {
    // Validate required fields
    if (!template.id || template.id.trim() === '') {
      throw new Error('RecurrenceTemplate id is required');
    }
    if (!template.name || template.name.trim() === '') {
      throw new Error('RecurrenceTemplate name is required');
    }
    if (!template.intervals || template.intervals.length === 0) {
      throw new Error('RecurrenceTemplate intervals array cannot be empty');
    }

    // Validate intervals
    for (const interval of template.intervals) {
      if (interval.value <= 0) {
        throw new Error('Interval value must be greater than 0');
      }
    }

    this.id = template.id;
    this.name = template.name.trim();
    this.intervals = [...template.intervals];
    this.dayOfMonth = template.dayOfMonth;
    this.weekday = template.weekday;
    this.occurrenceInMonth = template.occurrenceInMonth;
  }

  /**
   * Validate the recurrence template
   * @returns true if valid
   * @throws Error if invalid
   */
  validate(): boolean {
    if (!this.id || this.id.trim() === '') {
      throw new Error('RecurrenceTemplate id is required');
    }
    if (!this.name || this.name.trim() === '') {
      throw new Error('RecurrenceTemplate name is required');
    }
    if (!this.intervals || this.intervals.length === 0) {
      throw new Error('RecurrenceTemplate intervals array cannot be empty');
    }
    for (const interval of this.intervals) {
      if (interval.value <= 0) {
        throw new Error('Interval value must be greater than 0');
      }
    }
    return true;
  }

  /**
   * Convert to plain object
   * @returns Plain object representation
   */
  toObject(): IRecurrenceTemplate {
    return {
      id: this.id,
      name: this.name,
      intervals: [...this.intervals],
      dayOfMonth: this.dayOfMonth,
      weekday: this.weekday,
      occurrenceInMonth: this.occurrenceInMonth,
    };
  }
}
