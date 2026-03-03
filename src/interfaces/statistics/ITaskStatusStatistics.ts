/**
 * ITaskStatusStatistics Interface
 * Provides statistics about tasks grouped by their status
 */
export interface ITaskStatusStatistics {
  /** Count of tasks with TODO status */
  todo: number;
  /** Count of tasks with IN_PROGRESS status */
  inProgress: number;
  /** Count of tasks with DONE status */
  done: number;
  /** Count of tasks with CANCELLED status */
  cancelled: number;
  /** Total number of tasks across all statuses */
  total: number;
  /** Percentage of tasks in each status (0-100) */
  percentages: {
    todo: number;
    inProgress: number;
    done: number;
    cancelled: number;
  };
}
