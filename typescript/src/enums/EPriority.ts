/**
 * EPriority Enum
 * Defines all possible task priorities
 * Using const object to support erasableSyntaxOnly
 */
export const EPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type EPriority = typeof EPriority[keyof typeof EPriority];

/**
 * Priority values for sorting (higher = more urgent)
 */
export const PriorityValues: Record<EPriority, number> = {
  [EPriority.LOW]: 1,
  [EPriority.MEDIUM]: 2,
  [EPriority.HIGH]: 3,
  [EPriority.URGENT]: 4,
};
