import type { IRecurrenceTemplate } from '../interfaces/IRecurrenceTemplate.js';
import type { IRecurringTask } from '../interfaces/IRecurringTask.js';
import type { ITask } from '../interfaces/ITask.js';
import { RecurrenceCalculator } from './RecurrenceCalculator.js';
import { generateGuid } from '../utils/index.js';

/**
 * Maximum advance generation period (1 year in milliseconds)
 */
const MAX_ADVANCE_PERIOD_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * RecurringTaskGenerator Class
 * Generates new task instances from recurring tasks
 */
export class RecurringTaskGenerator {
  private recurrenceCalculator: RecurrenceCalculator;

  /**
   * Creates a new RecurringTaskGenerator instance
   */
  constructor() {
    this.recurrenceCalculator = new RecurrenceCalculator();
  }

  /**
   * Generate the next instance of a recurring task (legacy method)
   * @param task - The original task to generate from
   * @param template - The recurrence template
   * @returns A new task with updated dueDate
   */
  generateNextInstance(task: ITask, template: IRecurrenceTemplate): ITask {
    // Calculate the next due date
    const currentDueDate = task.dueDate ? new Date(task.dueDate) : new Date();
    const nextDueDate = this.recurrenceCalculator.calculateNextOccurrence(
      template,
      currentDueDate
    );

    // Generate new task instance
    const newTask: ITask = {
      id: generateGuid(),
      title: task.title,
      description: task.description,
      status: task.status === 'DONE' ? 'TODO' : task.status, // Reset status for new instance
      priority: task.priority,
      dueDate: nextDueDate,
      tags: task.tags ? [...task.tags] : [],
      recurrenceTemplateId: task.recurrenceTemplateId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newTask;
  }

  /**
   * Generate task instances from a RecurringTask entity up to 1 year ahead
   * @param recurringTask - The recurring task template
   * @returns Array of generated task instances
   */
  generateFromRecurringTask(recurringTask: IRecurringTask): ITask[] {
    const generatedTasks: ITask[] = [];
    const now = new Date();
    
    // Calculate end date for generation (1 year ahead or recurring task's end date)
    const maxEndDate = new Date(now.getTime() + MAX_ADVANCE_PERIOD_MS);
    const endDate = recurringTask.endDate 
      ? (recurringTask.endDate < maxEndDate ? recurringTask.endDate : maxEndDate)
      : maxEndDate;

    // Start from the recurring task's start date
    let currentDate = new Date(recurringTask.startDate);

    // If start date is in the past, calculate the next occurrence from now
    if (currentDate < now) {
      currentDate = this.calculateNextOccurrenceFromDate(
        recurringTask.intervals,
        now
      );
    }

    // Generate tasks until we reach the end date
    while (currentDate <= endDate) {
      const task = this.createTaskFromRecurringTask(recurringTask, currentDate);
      generatedTasks.push(task);

      // Calculate next occurrence
      currentDate = this.calculateNextOccurrenceFromDate(
        recurringTask.intervals,
        new Date(currentDate.getTime() + 1)
      );
    }

    return generatedTasks;
  }

  /**
   * Calculate the next occurrence date from a given date
   * @param intervals - The interval configuration
   * @param fromDate - The date to calculate from
   * @returns The next occurrence date
   */
  private calculateNextOccurrenceFromDate(
    intervals: IRecurringTask['intervals'],
    fromDate: Date
  ): Date {
    // Use the smallest interval to calculate next occurrence
    // For simplicity, we'll use the first interval
    if (!intervals || intervals.length === 0) {
      return new Date(fromDate.getTime() + MAX_ADVANCE_PERIOD_MS);
    }

    const interval = intervals[0];
    
    // Guard against invalid interval values that could cause infinite loops
    if (!interval.value || interval.value <= 0) {
      return new Date(fromDate.getTime() + MAX_ADVANCE_PERIOD_MS);
    }

    const nextDate = new Date(fromDate);

    switch (interval.unit) {
      case 'days':
        nextDate.setDate(nextDate.getDate() + interval.value);
        break;
      case 'weeks':
        nextDate.setDate(nextDate.getDate() + (interval.value * 7));
        break;
      case 'months':
        nextDate.setMonth(nextDate.getMonth() + interval.value);
        break;
      case 'years':
        nextDate.setFullYear(nextDate.getFullYear() + interval.value);
        break;
      default:
        // Unknown unit - return a date far in the future to break the loop
        return new Date(fromDate.getTime() + MAX_ADVANCE_PERIOD_MS);
    }

    // Ensure we always move forward in time
    if (nextDate.getTime() <= fromDate.getTime()) {
      return new Date(fromDate.getTime() + MAX_ADVANCE_PERIOD_MS);
    }

    return nextDate;
  }

  /**
   * Create a single task instance from a recurring task and due date
   * @param recurringTask - The recurring task template
   * @param dueDate - The calculated due date for the task
   * @returns A new task instance
   */
  createTaskFromRecurringTask(recurringTask: IRecurringTask, dueDate: Date): ITask {
    const now = new Date().toISOString();
    
    return {
      id: generateGuid(),
      title: recurringTask.title,
      description: recurringTask.description,
      status: 'TODO',
      priority: recurringTask.priority,
      dueDate: dueDate,
      tags: recurringTask.tags ? [...recurringTask.tags] : [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Calculate all occurrence dates for a recurring task
   * @param recurringTask - The recurring task template
   * @returns Array of occurrence dates
   */
  calculateOccurrences(recurringTask: IRecurringTask): Date[] {
    const occurrences: Date[] = [];
    const now = new Date();
    
    // Calculate end date for generation
    const maxEndDate = new Date(now.getTime() + MAX_ADVANCE_PERIOD_MS);
    const endDate = recurringTask.endDate 
      ? (recurringTask.endDate < maxEndDate ? recurringTask.endDate : maxEndDate)
      : maxEndDate;

    // Start from the recurring task's start date
    let currentDate = new Date(recurringTask.startDate);

    // If start date is in the past, calculate the next occurrence from now
    if (currentDate < now) {
      currentDate = this.calculateNextOccurrenceFromDate(
        recurringTask.intervals,
        now
      );
    }

    // Generate dates until we reach the end date
    while (currentDate <= endDate) {
      occurrences.push(new Date(currentDate));

      // Calculate next occurrence
      currentDate = this.calculateNextOccurrenceFromDate(
        recurringTask.intervals,
        new Date(currentDate.getTime() + 1)
      );
    }

    return occurrences;
  }

  /**
   * Check if a task can generate a next instance (legacy method)
   * @param task - The task to check
   * @returns true if the task has a recurrence template
   */
  canGenerateNextInstance(task: ITask): boolean {
    return !!task.recurrenceTemplateId;
  }
}
