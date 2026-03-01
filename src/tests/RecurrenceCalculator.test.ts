/**
 * Unit Tests for RecurrenceCalculator
 * Tests for calculating next occurrence dates based on recurrence templates
 */
import { describe, it, expect } from 'vitest';
import { RecurrenceCalculator } from '../domain/RecurrenceCalculator.js';

describe('RecurrenceCalculator', () => {
  const calculator = new RecurrenceCalculator();

  describe('Single Interval - Days', () => {
    it('should calculate next occurrence for daily recurrence', () => {
      const template = {
        id: '1',
        name: 'Daily',
        intervals: [{ value: 1, unit: 'days' as const }],
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getDate()).toBe(16);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should calculate next occurrence for every 3 days', () => {
      const template = {
        id: '1',
        name: 'Every 3 Days',
        intervals: [{ value: 3, unit: 'days' as const }],
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getDate()).toBe(18);
    });

    it('should handle month boundary for days', () => {
      const template = {
        id: '1',
        name: 'Every 5 Days',
        intervals: [{ value: 5, unit: 'days' as const }],
      };
      
      const currentDate = new Date('2024-01-30');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });
  });

  describe('Single Interval - Weeks', () => {
    it('should calculate next occurrence for weekly recurrence', () => {
      const template = {
        id: '1',
        name: 'Weekly',
        intervals: [{ value: 1, unit: 'weeks' as const }],
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getDate()).toBe(22);
      expect(result.getMonth()).toBe(0);
    });

    it('should calculate next occurrence for bi-weekly recurrence', () => {
      const template = {
        id: '1',
        name: 'Bi-weekly',
        intervals: [{ value: 2, unit: 'weeks' as const }],
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getDate()).toBe(29);
    });

    it('should handle month boundary for weeks', () => {
      const template = {
        id: '1',
        name: 'Weekly',
        intervals: [{ value: 1, unit: 'weeks' as const }],
      };
      
      const currentDate = new Date('2024-01-25');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(1);
    });
  });

  describe('Single Interval - Months', () => {
    it('should calculate next occurrence for monthly recurrence', () => {
      const template = {
        id: '1',
        name: 'Monthly',
        intervals: [{ value: 1, unit: 'months' as const }],
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(15);
    });

    it('should calculate next occurrence for quarterly recurrence', () => {
      const template = {
        id: '1',
        name: 'Quarterly',
        intervals: [{ value: 3, unit: 'months' as const }],
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(15);
    });

    it('should handle year boundary for months', () => {
      const template = {
        id: '1',
        name: 'Monthly',
        intervals: [{ value: 1, unit: 'months' as const }],
      };
      
      const currentDate = new Date('2024-12-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
    });
  });

  describe('Single Interval - Years', () => {
    it('should calculate next occurrence for yearly recurrence', () => {
      const template = {
        id: '1',
        name: 'Yearly',
        intervals: [{ value: 1, unit: 'years' as const }],
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it('should calculate next occurrence for every 2 years', () => {
      const template = {
        id: '1',
        name: 'Every 2 Years',
        intervals: [{ value: 2, unit: 'years' as const }],
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getFullYear()).toBe(2026);
    });
  });

  describe('Compound Intervals', () => {
    it('should handle multiple intervals applied sequentially - days and weeks', () => {
      const template = {
        id: '1',
        name: 'Every 2 weeks and 3 days',
        intervals: [
          { value: 2, unit: 'weeks' as const },
          { value: 3, unit: 'days' as const },
        ],
      };
      
      const currentDate = new Date('2024-01-01');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      // 2 weeks = 14 days, + 3 days = 17 days from Jan 1
      expect(result.getDate()).toBe(18);
    });

    it('should handle multiple intervals with months', () => {
      const template = {
        id: '1',
        name: 'Every month and 5 days',
        intervals: [
          { value: 1, unit: 'months' as const },
          { value: 5, unit: 'days' as const },
        ],
      };
      
      const currentDate = new Date('2024-01-10');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(15); // 10 + 5 = 15
    });
  });

  describe('Month Edge Cases', () => {
    it('should handle 31st day going to a month with fewer days', () => {
      const template = {
        id: '1',
        name: 'Monthly on 31st',
        intervals: [{ value: 1, unit: 'months' as const }],
        dayOfMonth: 31,
      };
      
      // January 31 -> February 29 (2024 is leap year)
      const currentDate = new Date('2024-01-31');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29); // Last day of February 2024
    });

    it('should handle 31st day going to April (30 days)', () => {
      const template = {
        id: '1',
        name: 'Monthly on 31st',
        intervals: [{ value: 1, unit: 'months' as const }],
        dayOfMonth: 31,
      };
      
      // March 31 -> April 30
      const currentDate = new Date('2024-03-31');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(30); // Last day of April
    });

    it('should handle 31st day going to February in non-leap year', () => {
      const template = {
        id: '1',
        name: 'Monthly on 31st',
        intervals: [{ value: 1, unit: 'months' as const }],
        dayOfMonth: 31,
      };
      
      // January 31 -> February 28 (2025 is not leap year)
      const currentDate = new Date('2025-01-31');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28); // Last day of February 2025
    });

    it('should use preferred day when provided', () => {
      const template = {
        id: '1',
        name: 'Monthly on 15th',
        intervals: [{ value: 1, unit: 'months' as const }],
        dayOfMonth: 15,
      };
      
      const currentDate = new Date('2024-01-20');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(15); // Uses the preferred day
    });
  });

  describe('Weekday-based Recurrence', () => {
    it('should calculate first Monday of month', () => {
      const template = {
        id: '1',
        name: 'First Monday of Month',
        intervals: [{ value: 1, unit: 'months' as const }],
        weekday: 1, // Monday
        occurrenceInMonth: 1, // First
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(5); // First Monday of February 2024
    });

    it('should calculate second Tuesday of month', () => {
      const template = {
        id: '1',
        name: 'Second Tuesday of Month',
        intervals: [{ value: 1, unit: 'months' as const }],
        weekday: 2, // Tuesday
        occurrenceInMonth: 2, // Second
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDay()).toBe(2); // Tuesday
      expect(result.getDate()).toBe(13); // Second Tuesday of February
    });

    it('should calculate last Friday of month', () => {
      const template = {
        id: '1',
        name: 'Last Friday of Month',
        intervals: [{ value: 1, unit: 'months' as const }],
        weekday: 5, // Friday
        occurrenceInMonth: -1, // Last
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDay()).toBe(5); // Friday
      // Last Friday of February 2024 is Feb 23
      expect(result.getDate()).toBe(23);
    });

    it('should handle weekday recurrence with compound intervals', () => {
      const template = {
        id: '1',
        name: 'Every 2 months, first Monday',
        intervals: [{ value: 2, unit: 'months' as const }],
        weekday: 1,
        occurrenceInMonth: 1,
      };
      
      const currentDate = new Date('2024-01-15');
      const result = calculator.calculateNextOccurrence(template, currentDate);
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2); // March (1 + 2 = 3, 0-indexed)
      expect(result.getDay()).toBe(1); // Monday
    });
  });

  describe('Validation', () => {
    it('should throw error for zero interval value', () => {
      const template = {
        id: '1',
        name: 'Invalid',
        intervals: [{ value: 0, unit: 'days' as const }],
      };
      
      const currentDate = new Date('2024-01-15');
      expect(() => calculator.calculateNextOccurrence(template, currentDate))
        .toThrow('Interval value must be greater than 0');
    });

    it('should throw error for negative interval value', () => {
      const template = {
        id: '1',
        name: 'Invalid',
        intervals: [{ value: -1, unit: 'days' as const }],
      };
      
      const currentDate = new Date('2024-01-15');
      expect(() => calculator.calculateNextOccurrence(template, currentDate))
        .toThrow('Interval value must be greater than 0');
    });
  });
});
