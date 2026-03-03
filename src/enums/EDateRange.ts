/**
 * EDateRange Enum
 * Defines date range options for time-based statistics queries
 * Using const object to support erasableSyntaxOnly
 */
export const EDateRange = {
  TODAY: 'TODAY',
  THIS_WEEK: 'THIS_WEEK',
  THIS_MONTH: 'THIS_MONTH',
  ALL: 'ALL',
} as const;

export type EDateRange = typeof EDateRange[keyof typeof EDateRange];
