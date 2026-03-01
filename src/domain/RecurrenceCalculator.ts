import type { IRecurrenceTemplate } from '../interfaces/IRecurrenceTemplate.js';
import type { IInterval } from '../interfaces/IInterval.js';

/**
 * RecurrenceCalculator Class
 * Calculates next occurrence dates based on recurrence templates
 */
export class RecurrenceCalculator {
  /**
   * Calculate the next occurrence date based on a template
   * @param template - The recurrence template
   * @param currentDate - The base date to calculate from
   * @returns The next occurrence date
   * @throws Error if interval values are invalid
   */
  calculateNextOccurrence(template: IRecurrenceTemplate, currentDate: Date): Date {
    // Validate intervals
    this.validateIntervals(template.intervals);

    // Handle weekday-based recurrence
    if (template.weekday !== undefined && template.occurrenceInMonth !== undefined) {
      return this.calculateWeekdayBasedOccurrence(template, currentDate);
    }

    // Apply intervals sequentially
    let resultDate = new Date(currentDate);

    for (const interval of template.intervals) {
      resultDate = this.applyInterval(resultDate, interval, template.dayOfMonth);
    }

    return resultDate;
  }

  /**
   * Validate that all interval values are positive
   */
  private validateIntervals(intervals: IInterval[]): void {
    for (const interval of intervals) {
      if (interval.value <= 0) {
        throw new Error('Interval value must be greater than 0');
      }
    }
  }

  /**
   * Apply a single interval to a date
   */
  private applyInterval(date: Date, interval: IInterval, dayOfMonth?: number): Date {
    const result = new Date(date);

    switch (interval.unit) {
      case 'days':
        result.setDate(result.getDate() + interval.value);
        break;
      case 'weeks':
        result.setDate(result.getDate() + interval.value * 7);
        break;
      case 'months':
        this.addMonths(result, interval.value, dayOfMonth);
        break;
      case 'years':
        result.setFullYear(result.getFullYear() + interval.value);
        break;
    }

    return result;
  }

  /**
   * Add months to a date, handling edge cases like month-end dates
   */
  private addMonths(date: Date, months: number, preferredDay?: number): void {
    const currentDay = date.getDate();
    const yearIncrease = Math.floor((date.getMonth() + months) / 12);
    const monthMod = (date.getMonth() + months) % 12;

    // Set to first of month to avoid overflow issues
    date.setDate(1);
    date.setMonth(monthMod);
    date.setFullYear(date.getFullYear() + yearIncrease);

    // Get the last day of the target month
    const lastDayOfMonth = this.getLastDayOfMonth(date);

    // Use preferred day if provided, otherwise use current day clamped to valid range
    const targetDay = preferredDay ?? currentDay;
    date.setDate(Math.min(targetDay, lastDayOfMonth));
  }

  /**
   * Get the last day of a month
   */
  private getLastDayOfMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Calculate occurrence for weekday-based recurrence (e.g., "First Monday of month")
   */
  private calculateWeekdayBasedOccurrence(
    template: IRecurrenceTemplate,
    currentDate: Date
  ): Date {
    const { weekday, occurrenceInMonth, intervals } = template;
    if (weekday === undefined || occurrenceInMonth === undefined) {
      return currentDate;
    }

    // Calculate the target month
    let targetDate = new Date(currentDate);

    // Apply intervals first to get to the target month
    for (const interval of intervals) {
      targetDate = this.applyInterval(targetDate, interval, template.dayOfMonth);
    }

    // Find the nth weekday in the month
    return this.getNthWeekdayInMonth(targetDate, weekday, occurrenceInMonth);
  }

  /**
   * Get the nth occurrence of a weekday in a month
   * @param date - Any date in the target month
   * @param weekday - 0-6 (Sunday-Saturday)
   * @param occurrence - Positive for nth occurrence, -1 for last
   */
  private getNthWeekdayInMonth(date: Date, weekday: number, occurrence: number): Date {
    const year = date.getFullYear();
    const month = date.getMonth();

    if (occurrence === -1) {
      // Last occurrence of weekday in month
      return this.getLastWeekdayInMonth(year, month, weekday);
    }

    // Get the first day of the month
    const firstDay = new Date(year, month, 1);

    // Find the first occurrence of the weekday
    const dayOfWeek = firstDay.getDay();
    let daysToAdd = weekday - dayOfWeek;
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }

    // Calculate the nth occurrence
    const nthDate = new Date(year, month, 1 + daysToAdd + (occurrence - 1) * 7);

    // Check if this date is still in the same month
    if (nthDate.getMonth() !== month) {
      // Return the 5th occurrence (or 4th if month only has 4)
      return this.getLastWeekdayInMonth(year, month, weekday);
    }

    return nthDate;
  }

  /**
   * Get the last occurrence of a weekday in a month
   */
  private getLastWeekdayInMonth(year: number, month: number, weekday: number): Date {
    const lastDay = new Date(year, month + 1, 0);
    const dayOfWeek = lastDay.getDay();

    // Calculate days to subtract to get to the target weekday
    let daysToSubtract = dayOfWeek - weekday;
    if (daysToSubtract < 0) {
      daysToSubtract += 7;
    }

    return new Date(year, month, lastDay.getDate() - daysToSubtract);
  }
}
