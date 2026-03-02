/**
 * EEntityType Enum
 * Defines all possible entity types for UnitOfWork routing
 * Using const object to support erasableSyntaxOnly
 */
export const EEntityType = {
  TASK: 'task',
  CATEGORY: 'category',
  RECURRENCE_TEMPLATE: 'recurrenceTemplate',
  RECURRING_TASK: 'recurringTask',
  TASK_RECURRING_LINK: 'taskRecurringLink',
  TASK_DEPENDENCY: 'taskDependency',
} as const;

export type EEntityType = typeof EEntityType[keyof typeof EEntityType];
