/**
 * IInterval Interface
 * Defines a single interval component for recurrence patterns
 */
export interface IInterval {
  /** The numeric value of the interval (e.g., 3 for "every 3 days") */
  value: number;
  /** The unit of time for the interval */
  unit: 'days' | 'weeks' | 'months' | 'years';
}
