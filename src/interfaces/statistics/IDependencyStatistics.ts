/**
 * DependencyCountDistribution Interface
 * Distribution of tasks by number of dependencies
 */
export interface DependencyCountDistribution {
  /** Number of dependencies */
  dependencyCount: number;
  /** Number of tasks with this dependency count */
  taskCount: number;
}

/**
 * IDependencyStatistics Interface
 * Provides statistics about task dependencies and blockers
 */
export interface IDependencyStatistics {
  /** Count of tasks that other tasks depend on */
  tasksWithDependencies: number;
  /** Count of tasks with dependencies not yet satisfied */
  blockedTasks: number;
  /** Distribution of tasks by number of dependencies */
  dependencyCountDistribution: DependencyCountDistribution[];
  /** Count of subtask relationships */
  subtaskCount: number;
  /** Whether circular dependencies exist */
  hasCircularDependencies: boolean;
}
