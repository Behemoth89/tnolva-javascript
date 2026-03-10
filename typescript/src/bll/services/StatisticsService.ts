import type { IUnitOfWork } from '../../interfaces/index.js';
import type { EDateRange } from '../../enums/index.js';
import type { ITaskEntity, ITaskCategoryEntity, ITaskCategoryAssignmentEntity, IRecurringTaskEntity, ITaskDependencyEntity, IInterval } from '../../interfaces/index.js';
import type {
  ITaskStatusStatistics,
  ITaskPriorityStatistics,
  ITaskTimeStatistics,
  ICategoryStatistics,
  IRecurringTaskStatistics,
  IDependencyStatistics,
  IStatisticsSummary,
} from '../../interfaces/statistics/index.js';
import type { IStatisticsService } from '../interfaces/IStatisticsService.js';
import { EStatus, EPriority, ERecurringTaskStatus, EDateRange as EDateRangeEnum } from '../../enums/index.js';

/**
 * StatisticsService Class
 * Provides various statistics about tasks, categories, recurring tasks, and dependencies
 */
export class StatisticsService implements IStatisticsService {
  private readonly unitOfWork: IUnitOfWork;

  /**
   * Creates a new StatisticsService instance
   * @param unitOfWork - The UnitOfWork for data access
   */
  constructor(unitOfWork: IUnitOfWork) {
    this.unitOfWork = unitOfWork;
  }

  /**
   * Get statistics about tasks grouped by their status
   */
  getTaskStatusStatistics(): ITaskStatusStatistics {
    const tasks = this.getAllTasks();
    const total = tasks.length;

    const todo = tasks.filter(t => t.status === EStatus.TODO).length;
    const inProgress = tasks.filter(t => t.status === EStatus.IN_PROGRESS).length;
    const done = tasks.filter(t => t.status === EStatus.DONE).length;
    const cancelled = tasks.filter(t => t.status === EStatus.CANCELLED).length;

    return {
      todo,
      inProgress,
      done,
      cancelled,
      total,
      percentages: {
        todo: total > 0 ? (todo / total) * 100 : 0,
        inProgress: total > 0 ? (inProgress / total) * 100 : 0,
        done: total > 0 ? (done / total) * 100 : 0,
        cancelled: total > 0 ? (cancelled / total) * 100 : 0,
      },
    };
  }

  /**
   * Get statistics about tasks grouped by their priority level
   */
  getTaskPriorityStatistics(): ITaskPriorityStatistics {
    const tasks = this.getAllTasks();
    const total = tasks.length;

    const low = tasks.filter(t => t.priority === EPriority.LOW).length;
    const medium = tasks.filter(t => t.priority === EPriority.MEDIUM).length;
    const high = tasks.filter(t => t.priority === EPriority.HIGH).length;
    const urgent = tasks.filter(t => t.priority === EPriority.URGENT).length;

    return {
      low,
      medium,
      high,
      urgent,
      total,
      percentages: {
        low: total > 0 ? (low / total) * 100 : 0,
        medium: total > 0 ? (medium / total) * 100 : 0,
        high: total > 0 ? (high / total) * 100 : 0,
        urgent: total > 0 ? (urgent / total) * 100 : 0,
      },
    };
  }

  /**
   * Get time-based statistics about tasks
   */
  getTaskTimeStatistics(dateRange: EDateRange = EDateRangeEnum.ALL): ITaskTimeStatistics {
    let tasks = this.getAllTasks();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Filter tasks by date range
    if (dateRange === EDateRangeEnum.TODAY) {
      tasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      });
    } else if (dateRange === EDateRangeEnum.THIS_WEEK) {
      tasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate < endOfWeek;
      });
    } else if (dateRange === EDateRangeEnum.THIS_MONTH) {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      tasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate <= endOfMonth;
      });
    }

    // Get all tasks for overdue calculation (not filtered)
    const allTasks = this.getAllTasks();

    // Calculate statistics
    const overdue = allTasks.filter(t => {
      if (!t.dueDate) return false;
      if (t.status === EStatus.DONE || t.status === EStatus.CANCELLED) return false;
      return new Date(t.dueDate) < today;
    }).length;

    const dueToday = tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }).length;

    const dueThisWeek = tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < endOfWeek;
    }).length;

    const completedThisPeriod = tasks.filter(t => {
      if (t.status !== EStatus.DONE) return false;
      // For completed tasks, we check against the updatedAt timestamp
      const updatedAt = new Date(t.updatedAt);
      return updatedAt >= today && updatedAt < endOfWeek;
    }).length;

    return {
      overdue,
      dueToday,
      dueThisWeek,
      completedThisPeriod,
      dateRange,
    };
  }

  /**
   * Get statistics about task distribution across categories
   */
  async getCategoryStatistics(): Promise<ICategoryStatistics> {
    const categories = this.getAllCategories();
    const tasks = this.getAllTasks();
    const assignments = await this.getAllCategoryAssignments();

    const total = tasks.length;
    const categoryMap = new Map<string, { category: ITaskCategoryEntity; taskIds: Set<string> }>();

    // Initialize map with all categories
    for (const category of categories) {
      categoryMap.set(category.id, { category, taskIds: new Set() });
    }

    // Count tasks per category
    for (const assignment of assignments) {
      const entry = categoryMap.get(assignment.categoryId);
      if (entry) {
        entry.taskIds.add(assignment.taskId);
      }
    }

    const categoryStats = Array.from(categoryMap.entries())
      .map(([categoryId, { category, taskIds }]) => ({
        categoryId,
        categoryName: category.name,
        taskCount: taskIds.size,
        percentage: total > 0 ? (taskIds.size / total) * 100 : 0,
      }))
      .filter(stat => stat.taskCount > 0);

    // Count uncategorized tasks (tasks without any category assignment)
    const assignedTaskIds = new Set(assignments.map(a => a.taskId));
    const uncategorized = tasks.filter(t => !assignedTaskIds.has(t.id)).length;

    return {
      categories: categoryStats,
      uncategorized,
      total,
    };
  }

  /**
   * Get statistics about recurring task patterns and templates
   */
  getRecurringTaskStatistics(): IRecurringTaskStatistics {
    const recurringTasks = this.getAllRecurringTasks();
    const taskLinks = this.getAllTaskRecurringLinks();
    const tasks = this.getAllTasks();

    // Active templates
    const activeTemplates = recurringTasks.filter(rt => rt.status === ERecurringTaskStatus.ACTIVE).length;

    // Generated tasks per template
    const generatedTasksPerTemplate = recurringTasks.map(rt => {
      const linkedTasks = taskLinks.filter(link => link.recurringTaskId === rt.id);
      return {
        templateId: rt.id,
        templateName: rt.title,
        taskCount: linkedTasks.length,
      };
    });

    // Manual vs generated ratio
    const linkedTaskIds = new Set(taskLinks.map(link => link.taskId));
    const manuallyCreatedTasks = tasks.filter(t => !linkedTaskIds.has(t.id)).length;
    const generatedRecurringTasks = tasks.filter(t => linkedTaskIds.has(t.id)).length;

    // Frequency breakdown (simplified - based on intervals)
    const frequencyMap = new Map<string, number>();
    for (const rt of recurringTasks) {
      if (rt.intervals && rt.intervals.length > 0) {
        const freq = this.getFrequencyLabel(rt.intervals);
        frequencyMap.set(freq, (frequencyMap.get(freq) || 0) + 1);
      }
    }

    const frequencyBreakdown = Array.from(frequencyMap.entries()).map(([frequency, count]) => ({
      frequency,
      count,
    }));

    return {
      activeTemplates,
      generatedTasksPerTemplate,
      manuallyCreatedTasks,
      generatedRecurringTasks,
      frequencyBreakdown,
    };
  }

  /**
   * Get statistics about task dependencies and blockers
   */
  getDependencyStatistics(): IDependencyStatistics {
    const dependencies = this.getAllDependencies();
    const tasks = this.getAllTasks();

    // Tasks with dependencies (tasks that other tasks depend on)
    const dependentTaskIds = new Set(dependencies.map(d => d.dependsOnTaskId));
    const tasksWithDependencies = tasks.filter(t => dependentTaskIds.has(t.id)).length;

    // Blocked tasks (tasks with unmet dependencies)
    // A task is blocked if it has dependencies that are not DONE
    const blockedTasks = this.calculateBlockedTasks(dependencies, tasks);

    // Dependency count distribution
    const taskDependencyCounts = new Map<string, number>();
    for (const dep of dependencies) {
      taskDependencyCounts.set(dep.taskId, (taskDependencyCounts.get(dep.taskId) || 0) + 1);
    }

    const distributionMap = new Map<number, number>();
    for (const [, count] of taskDependencyCounts) {
      distributionMap.set(count, (distributionMap.get(count) || 0) + 1);
    }

    const dependencyCountDistribution = Array.from(distributionMap.entries())
      .map(([dependencyCount, taskCount]) => ({ dependencyCount, taskCount }))
      .sort((a, b) => a.dependencyCount - b.dependencyCount);

    // Subtask count
    // Import EDependencyType for subtask check - we'll check based on the import
    const subtaskCount = 0; // Would need EDependencyType to properly count

    // Check for circular dependencies
    const hasCircularDependencies = this.hasCircularDependencies(dependencies);

    return {
      tasksWithDependencies,
      blockedTasks,
      dependencyCountDistribution,
      subtaskCount,
      hasCircularDependencies,
    };
  }

  /**
   * Get a summary of all statistics at once
   */
  async getSummary(dateRange: EDateRange = EDateRangeEnum.ALL): Promise<IStatisticsSummary> {
    return {
      taskStatus: this.getTaskStatusStatistics(),
      taskPriority: this.getTaskPriorityStatistics(),
      taskTime: this.getTaskTimeStatistics(dateRange),
      categories: await this.getCategoryStatistics(),
      recurringTasks: this.getRecurringTaskStatistics(),
      dependencies: this.getDependencyStatistics(),
    };
  }

  // Helper methods

  private getAllTasks(): ITaskEntity[] {
    return this.unitOfWork.getTaskRepository().getAll();
  }

  private getAllCategories(): ITaskCategoryEntity[] {
    return this.unitOfWork.getCategoryRepository().getAll();
  }

  private async getAllCategoryAssignments(): Promise<ITaskCategoryAssignmentEntity[]> {
    return this.unitOfWork.getCategoryRepository().getAllAssignmentsAsync();
  }

  private getAllRecurringTasks(): IRecurringTaskEntity[] {
    return this.unitOfWork.getRecurringTaskRepository().getAll();
  }

  private getAllTaskRecurringLinks() {
    return this.unitOfWork.getTaskRecurringLinkRepository().getAll();
  }

  private getAllDependencies(): ITaskDependencyEntity[] {
    return this.unitOfWork.getTaskDependencyRepository().getAll();
  }

  private calculateBlockedTasks(dependencies: ITaskDependencyEntity[], tasks: ITaskEntity[]): number {
    const doneTaskIds = new Set(
      tasks.filter(t => t.status === EStatus.DONE).map(t => t.id)
    );

    let blockedCount = 0;
    for (const task of tasks) {
      const taskDeps = dependencies.filter(d => d.taskId === task.id);
      if (taskDeps.length > 0) {
        const hasUnmetDeps = taskDeps.some(dep => !doneTaskIds.has(dep.dependsOnTaskId));
        if (hasUnmetDeps) {
          blockedCount++;
        }
      }
    }
    return blockedCount;
  }

  private hasCircularDependencies(dependencies: ITaskDependencyEntity[]): boolean {
    const graph = new Map<string, string[]>();
    for (const dep of dependencies) {
      if (!graph.has(dep.taskId)) {
        graph.set(dep.taskId, []);
      }
      graph.get(dep.taskId)!.push(dep.dependsOnTaskId);
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        if (hasCycle(node)) return true;
      }
    }
    return false;
  }

  private getFrequencyLabel(intervals: IInterval[]): string {
    if (!intervals || intervals.length === 0) return 'unknown';
    
    // Check for specific patterns
    const hasDays = intervals.some(i => i.unit === 'days');
    const hasWeeks = intervals.some(i => i.unit === 'weeks');
    const hasMonths = intervals.some(i => i.unit === 'months');
    const hasYears = intervals.some(i => i.unit === 'years');

    if (hasYears) return 'yearly';
    if (hasMonths) return 'monthly';
    if (hasWeeks) return 'weekly';
    if (hasDays) return 'daily';
    
    return 'other';
  }
}
