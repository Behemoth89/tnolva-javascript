import type { ITaskStatusStatistics } from './ITaskStatusStatistics.js';
import type { ITaskPriorityStatistics } from './ITaskPriorityStatistics.js';
import type { ITaskTimeStatistics } from './ITaskTimeStatistics.js';
import type { ICategoryStatistics } from './ICategoryStatistics.js';
import type { IRecurringTaskStatistics } from './IRecurringTaskStatistics.js';
import type { IDependencyStatistics } from './IDependencyStatistics.js';

/**
 * IStatisticsSummary Interface
 * Provides a summary of all statistics at once
 */
export interface IStatisticsSummary {
  /** Task status statistics */
  taskStatus: ITaskStatusStatistics;
  /** Task priority statistics */
  taskPriority: ITaskPriorityStatistics;
  /** Task time statistics */
  taskTime: ITaskTimeStatistics;
  /** Category statistics */
  categories: ICategoryStatistics;
  /** Recurring task statistics */
  recurringTasks: IRecurringTaskStatistics;
  /** Dependency statistics */
  dependencies: IDependencyStatistics;
}
