/**
 * Unit Tests for RecurrenceTemplate Entity
 * Tests for RecurrenceTemplate entity creation, validation, and serialization
 */
import { describe, it, expect } from 'vitest';
import { RecurrenceTemplate } from '../domain/RecurrenceTemplate.js';

describe('RecurrenceTemplate Entity Creation', () => {
  it('should create a recurrence template with all properties', () => {
    const template = new RecurrenceTemplate({
      id: 'template-1',
      name: 'Every 2 Days',
      intervals: [{ value: 2, unit: 'days' }],
      dayOfMonth: 15,
    });

    expect(template.id).toBe('template-1');
    expect(template.name).toBe('Every 2 Days');
    expect(template.intervals).toHaveLength(1);
    expect(template.intervals[0].value).toBe(2);
    expect(template.intervals[0].unit).toBe('days');
    expect(template.dayOfMonth).toBe(15);
  });

  it('should create a recurrence template with weekday and occurrence', () => {
    const template = new RecurrenceTemplate({
      id: 'template-2',
      name: 'First Monday of Month',
      intervals: [{ value: 1, unit: 'months' }],
      weekday: 1,
      occurrenceInMonth: 1,
    });

    expect(template.weekday).toBe(1);
    expect(template.occurrenceInMonth).toBe(1);
  });

  it('should create a recurrence template with required fields only', () => {
    const template = new RecurrenceTemplate({
      id: 'template-3',
      name: 'Daily',
      intervals: [{ value: 1, unit: 'days' }],
    });

    expect(template.id).toBe('template-3');
    expect(template.name).toBe('Daily');
    expect(template.intervals).toHaveLength(1);
    expect(template.dayOfMonth).toBeUndefined();
    expect(template.weekday).toBeUndefined();
    expect(template.occurrenceInMonth).toBeUndefined();
  });

  it('should create a template with multiple intervals', () => {
    const template = new RecurrenceTemplate({
      id: 'template-4',
      name: 'Every 2 weeks and 3 days',
      intervals: [
        { value: 2, unit: 'weeks' },
        { value: 3, unit: 'days' },
      ],
    });

    expect(template.intervals).toHaveLength(2);
    expect(template.intervals[0].value).toBe(2);
    expect(template.intervals[0].unit).toBe('weeks');
    expect(template.intervals[1].value).toBe(3);
    expect(template.intervals[1].unit).toBe('days');
  });

  it('should throw error when id is missing', () => {
    expect(
      () => new RecurrenceTemplate({ id: '', name: 'Test', intervals: [{ value: 1, unit: 'days' }] })
    ).toThrow('RecurrenceTemplate id is required');
  });

  it('should throw error when name is missing', () => {
    expect(
      () => new RecurrenceTemplate({ id: '1', name: '', intervals: [{ value: 1, unit: 'days' }] })
    ).toThrow('RecurrenceTemplate name is required');
  });

  it('should throw error when intervals array is empty', () => {
    expect(
      () => new RecurrenceTemplate({ id: '1', name: 'Test', intervals: [] })
    ).toThrow('RecurrenceTemplate intervals array cannot be empty');
  });

  it('should throw error when intervals array is missing', () => {
    expect(
      () => new RecurrenceTemplate({ id: '1', name: 'Test', intervals: undefined as never })
    ).toThrow('RecurrenceTemplate intervals array cannot be empty');
  });

  it('should throw error when interval value is zero', () => {
    expect(
      () => new RecurrenceTemplate({ id: '1', name: 'Test', intervals: [{ value: 0, unit: 'days' }] })
    ).toThrow('Interval value must be greater than 0');
  });

  it('should throw error when interval value is negative', () => {
    expect(
      () => new RecurrenceTemplate({ id: '1', name: 'Test', intervals: [{ value: -1, unit: 'days' }] })
    ).toThrow('Interval value must be greater than 0');
  });

  it('should trim whitespace from name', () => {
    const template = new RecurrenceTemplate({
      id: '1',
      name: '  Daily Task  ',
      intervals: [{ value: 1, unit: 'days' }],
    });

    expect(template.name).toBe('Daily Task');
  });

  it('should create a copy of intervals array', () => {
    const originalIntervals: { value: number; unit: 'days' | 'weeks' | 'months' | 'years'; }[] = [{ value: 1, unit: 'days' }];
    const template = new RecurrenceTemplate({
      id: '1',
      name: 'Test',
      intervals: originalIntervals,
    });

    // Modify original array
    originalIntervals.push({ value: 2, unit: 'weeks' });

    // Template should not be affected
    expect(template.intervals).toHaveLength(1);
  });
});

describe('RecurrenceTemplate Validation', () => {
  it('should validate successfully for valid template', () => {
    const template = new RecurrenceTemplate({
      id: '1',
      name: 'Valid Template',
      intervals: [{ value: 1, unit: 'days' }],
    });

    expect(template.validate()).toBe(true);
  });

  it('should throw error when validating with empty id', () => {
    const template = new RecurrenceTemplate({
      id: '1',
      name: 'Test',
      intervals: [{ value: 1, unit: 'days' }],
    });

    template.id = '';
    expect(() => template.validate()).toThrow('RecurrenceTemplate id is required');
  });

  it('should throw error when validating with empty name', () => {
    const template = new RecurrenceTemplate({
      id: '1',
      name: 'Test',
      intervals: [{ value: 1, unit: 'days' }],
    });

    template.name = '';
    expect(() => template.validate()).toThrow('RecurrenceTemplate name is required');
  });

  it('should throw error when validating with empty intervals', () => {
    const template = new RecurrenceTemplate({
      id: '1',
      name: 'Test',
      intervals: [{ value: 1, unit: 'days' }],
    });

    template.intervals = [];
    expect(() => template.validate()).toThrow('RecurrenceTemplate intervals array cannot be empty');
  });

  it('should throw error when validating with invalid interval value', () => {
    const template = new RecurrenceTemplate({
      id: '1',
      name: 'Test',
      intervals: [{ value: 1, unit: 'days' }],
    });

    template.intervals[0].value = 0;
    expect(() => template.validate()).toThrow('Interval value must be greater than 0');
  });
});

describe('RecurrenceTemplate toObject', () => {
  it('should convert to plain object', () => {
    const template = new RecurrenceTemplate({
      id: '1',
      name: 'Test Template',
      intervals: [{ value: 1, unit: 'days' }],
      dayOfMonth: 10,
      weekday: 2,
      occurrenceInMonth: 3,
    });

    const obj = template.toObject();

    expect(obj.id).toBe('1');
    expect(obj.name).toBe('Test Template');
    expect(obj.intervals).toHaveLength(1);
    expect(obj.intervals[0].value).toBe(1);
    expect(obj.intervals[0].unit).toBe('days');
    expect(obj.dayOfMonth).toBe(10);
    expect(obj.weekday).toBe(2);
    expect(obj.occurrenceInMonth).toBe(3);
  });

  it('should return copy of intervals array', () => {
    const template = new RecurrenceTemplate({
      id: '1',
      name: 'Test',
      intervals: [{ value: 1, unit: 'days' }],
    });

    const obj = template.toObject();
    obj.intervals.push({ value: 2, unit: 'weeks' });

    // Original template should not be affected
    expect(template.intervals).toHaveLength(1);
  });

  it('should handle optional fields being undefined', () => {
    const template = new RecurrenceTemplate({
      id: '1',
      name: 'Simple Template',
      intervals: [{ value: 1, unit: 'days' }],
    });

    const obj = template.toObject();

    expect(obj.dayOfMonth).toBeUndefined();
    expect(obj.weekday).toBeUndefined();
    expect(obj.occurrenceInMonth).toBeUndefined();
  });
});
