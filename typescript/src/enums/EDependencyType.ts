/**
 * EDependencyType Enum
 * Defines all possible task dependency types
 * Using const object to support erasableSyntaxOnly
 */
export const EDependencyType = {
  SUBTASK: 'subtask',
} as const;

export type EDependencyType = typeof EDependencyType[keyof typeof EDependencyType];
