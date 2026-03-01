import type { IInterval } from './IInterval.js';

/**
 * IRecurrenceTemplate Interface
 * Defines the structure for recurrence template objects
 */
export interface IRecurrenceTemplate {
  /** Unique identifier for the template */
  id: string;
  /** User-friendly name (e.g., "Every 2 weeks", "Monthly on 15th") */
  name: string;
  /** Array of interval components that define the recurrence pattern */
  intervals: IInterval[];
  /** Optional: Day of month for monthly patterns (1-31) */
  dayOfMonth?: number;
  /** Optional: Day of week for weekly patterns (0-6, Sunday-Saturday) */
  weekday?: number;
  /** Optional: nth occurrence of weekday in month (1-5 for nth, -1 for last) */
  occurrenceInMonth?: number;
}
