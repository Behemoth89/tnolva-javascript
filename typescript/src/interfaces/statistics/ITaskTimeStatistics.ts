import type { EDateRange } from '../../enums/index.js';

/**
 * ITaskTimeStatistics Interface
 * Provides time-based statistics about tasks including overdue, due soon, and completion trends
 */
export interface ITaskTimeStatistics {
  /** Count of tasks where dueDate is in the past and status is not DONE or CANCELLED */
  overdue: number;
  /** Count of tasks due today */
  dueToday: number;
  /** Count of tasks due within the next 7 days */
  dueThisWeek: number;
  /** Count of tasks completed in the specified time period */
  completedThisPeriod: number;
  /** The date range used for this statistics query */
  dateRange: EDateRange;
}
