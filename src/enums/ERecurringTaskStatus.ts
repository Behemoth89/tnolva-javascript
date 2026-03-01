/**
 * ERecurringTaskStatus Enum
 * Defines all possible statuses for a recurring task
 * Using const object to support erasableSyntaxOnly
 */
export const ERecurringTaskStatus = {
  ACTIVE: 'ACTIVE',
  STOPPED: 'STOPPED',
} as const;

export type ERecurringTaskStatus = typeof ERecurringTaskStatus[keyof typeof ERecurringTaskStatus];
