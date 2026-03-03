import type { EDateRange } from '../../enums/index.js';
import type {
  ITaskStatusStatistics,
  ITaskPriorityStatistics,
  ITaskTimeStatistics,
  ICategoryStatistics,
  IRecurringTaskStatistics,
  IDependencyStatistics,
  IStatisticsSummary,
} from '../../interfaces/statistics/index.js';

/**
 * IStatisticsService Interface
 * Defines the contract for retrieving various statistics about tasks, categories,
 * recurring tasks, and dependencies
 */
export interface IStatisticsService {
  /**
   * Get statistics about tasks grouped by their status
   * @returns Task status statistics including counts and percentages
   */
  getTaskStatusStatistics(): ITaskStatusStatistics;

  /**
   * Get statistics about tasks grouped by their priority level
   * @returns Task priority statistics including counts and percentages
   */
  getTaskPriorityStatistics(): ITaskPriorityStatistics;

  /**
   * Get time-based statistics about tasks
   * @param dateRange - The date range to calculate statistics for
   * @returns Task time statistics including overdue, due today, due this week
   */
  getTaskTimeStatistics(dateRange?: EDateRange): ITaskTimeStatistics;

  /**
   * Get statistics about task distribution across categories
   * @returns Category statistics including tasks per category
   */
  getCategoryStatistics(): Promise<ICategoryStatistics>;

  /**
   * Get statistics about recurring task patterns and templates
   * @returns Recurring task statistics including active templates
   */
  getRecurringTaskStatistics(): IRecurringTaskStatistics;

  /**
   * Get statistics about task dependencies and blockers
   * @returns Dependency statistics including blocked tasks
   */
  getDependencyStatistics(): IDependencyStatistics;

  /**
   * Get a summary of all statistics at once
   * @param dateRange - Optional date range for time-based statistics
   * @returns Complete statistics summary
   */
  getSummary(dateRange?: EDateRange): Promise<IStatisticsSummary>;
}
