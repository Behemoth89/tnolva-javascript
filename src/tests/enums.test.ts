/**
 * Unit Tests for Enums
 * Tests for EStatus and EPriority enum values
 */
import { describe, it, expect } from 'vitest';
import { EStatus } from '../enums/EStatus.js';
import { EPriority, PriorityValues } from '../enums/EPriority.js';

describe('EStatus Enum', () => {
  it('should have TODO value', () => {
    expect(EStatus.TODO).toBe('TODO');
  });

  it('should have IN_PROGRESS value', () => {
    expect(EStatus.IN_PROGRESS).toBe('IN_PROGRESS');
  });

  it('should have DONE value', () => {
    expect(EStatus.DONE).toBe('DONE');
  });

  it('should have CANCELLED value', () => {
    expect(EStatus.CANCELLED).toBe('CANCELLED');
  });

  it('should have all required status values', () => {
    const statusValues = [EStatus.TODO, EStatus.IN_PROGRESS, EStatus.DONE, EStatus.CANCELLED];
    expect(statusValues).toHaveLength(4);
  });
});

describe('EPriority Enum', () => {
  it('should have LOW value', () => {
    expect(EPriority.LOW).toBe('LOW');
  });

  it('should have MEDIUM value', () => {
    expect(EPriority.MEDIUM).toBe('MEDIUM');
  });

  it('should have HIGH value', () => {
    expect(EPriority.HIGH).toBe('HIGH');
  });

  it('should have URGENT value', () => {
    expect(EPriority.URGENT).toBe('URGENT');
  });

  it('should have all required priority values', () => {
    const priorityValues = [EPriority.LOW, EPriority.MEDIUM, EPriority.HIGH, EPriority.URGENT];
    expect(priorityValues).toHaveLength(4);
  });

  it('should have correct priority values for sorting', () => {
    expect(PriorityValues[EPriority.LOW]).toBe(1);
    expect(PriorityValues[EPriority.MEDIUM]).toBe(2);
    expect(PriorityValues[EPriority.HIGH]).toBe(3);
    expect(PriorityValues[EPriority.URGENT]).toBe(4);
  });

  it('should order priorities correctly (URGENT > HIGH > MEDIUM > LOW)', () => {
    expect(PriorityValues[EPriority.URGENT]).toBeGreaterThan(PriorityValues[EPriority.HIGH]);
    expect(PriorityValues[EPriority.HIGH]).toBeGreaterThan(PriorityValues[EPriority.MEDIUM]);
    expect(PriorityValues[EPriority.MEDIUM]).toBeGreaterThan(PriorityValues[EPriority.LOW]);
  });
});
