/**
 * EStatus Enum
 * Defines all possible task statuses
 * Using const object to support erasableSyntaxOnly
 */
export const EStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;

export type EStatus = typeof EStatus[keyof typeof EStatus];
