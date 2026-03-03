/**
 * ITaskPriorityStatistics Interface
 * Provides statistics about tasks grouped by their priority level
 */
export interface ITaskPriorityStatistics {
  /** Count of tasks with LOW priority */
  low: number;
  /** Count of tasks with MEDIUM priority */
  medium: number;
  /** Count of tasks with HIGH priority */
  high: number;
  /** Count of tasks with URGENT priority */
  urgent: number;
  /** Total number of tasks across all priorities */
  total: number;
  /** Percentage of tasks in each priority level (0-100) */
  percentages: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}
