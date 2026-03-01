import type { IRecurringTask } from '../interfaces/IRecurringTask.js';
import type { IRecurringTaskRepository } from '../interfaces/IRecurringTaskRepository.js';
import type { ITask } from '../interfaces/ITask.js';
import type { ITaskRepository } from '../interfaces/ITaskRepository.js';
import type { ITaskRecurringLinkRepository } from '../interfaces/ITaskRecurringLinkRepository.js';
import { EStatus } from '../enums/EStatus.js';
import { RecurringTaskGenerator } from '../domain/RecurringTaskGenerator.js';
import { TaskRecurringLink } from '../domain/TaskRecurringLink.js';

/**
 * Maximum advance generation period (1 year in milliseconds)
 */
const MAX_ADVANCE_PERIOD_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * BatchGenerationResult
 * Result of a batch generation operation
 */
export interface BatchGenerationResult {
  /** Number of tasks generated */
  generatedCount: number;
  /** Number of recurring tasks processed */
  processedCount: number;
  /** Number of errors encountered */
  errorCount: number;
  /** Error messages if any */
  errors: string[];
}

/**
 * Generate all pending tasks for all active recurring tasks
 * This utility can be called from admin panel or scheduled monthly
 * 
 * @param recurringTaskRepository - Repository for recurring tasks
 * @param taskRepository - Repository for tasks
 * @param taskRecurringLinkRepository - Repository for task-recurring links
 * @returns Result of the batch generation
 */
export async function generateAllPendingTasks(
  recurringTaskRepository: IRecurringTaskRepository,
  taskRepository: ITaskRepository,
  taskRecurringLinkRepository: ITaskRecurringLinkRepository
): Promise<BatchGenerationResult> {
  const generator = new RecurringTaskGenerator();
  const result: BatchGenerationResult = {
    generatedCount: 0,
    processedCount: 0,
    errorCount: 0,
    errors: [],
  };

  try {
    // Get all active recurring tasks
    const activeTasks = await recurringTaskRepository.getActiveAsync();
    result.processedCount = activeTasks.length;

    const now = new Date();

    for (const recurringTask of activeTasks) {
      try {
        // Get existing linked tasks
        const existingLinks = await taskRecurringLinkRepository.getByRecurringTaskIdAsync(recurringTask.id);
        
        // Find the latest due date among existing non-done tasks
        let latestDueDate: Date | null = null;
        
        for (const link of existingLinks) {
          const task = await taskRepository.getByIdAsync(link.taskId);
          if (task && task.status !== EStatus.DONE) {
            if (task.dueDate) {
              const taskDueDate = new Date(task.dueDate);
              if (!latestDueDate || taskDueDate > latestDueDate) {
                latestDueDate = taskDueDate;
              }
            }
          }
        }

        // Calculate the end date for generation (1 year ahead)
        const maxEndDate = new Date(now.getTime() + MAX_ADVANCE_PERIOD_MS);
        const endDate = recurringTask.endDate 
          ? (recurringTask.endDate < maxEndDate ? recurringTask.endDate : maxEndDate)
          : maxEndDate;

        // Start generation from the latest due date or start date
        let startDate = latestDueDate 
          ? new Date(latestDueDate.getTime() + 1)
          : new Date(recurringTask.startDate);

        // Skip if we've already generated up to the end date
        if (startDate > endDate) {
          continue;
        }

        // Generate new tasks
        const newTasks: ITask[] = [];
        
        // Calculate occurrences from start date
        while (startDate <= endDate) {
          // Check if we already have a task for this due date
          const taskExists = existingLinks.some((link: typeof existingLinks[number]) => {
            // Note: This is a simplification - in production, you'd want to cache or restructure
            const existingTaskSync = taskRepository.getById(link.taskId);
            if (existingTaskSync && existingTaskSync.dueDate) {
              const existingDate = new Date(existingTaskSync.dueDate);
              // Use tolerance-based comparison to handle time component differences
              const timeDiff = Math.abs(existingDate.getTime() - startDate.getTime());
              return timeDiff < 1000; // Within 1 second tolerance
            }
            return false;
          });

          if (!taskExists) {
            const task = generator.createTaskFromRecurringTask(recurringTask, new Date(startDate));
            newTasks.push(task);
          }

          // Move to next occurrence
          startDate = calculateNextOccurrence(startDate, recurringTask.intervals);
        }

        // Save new tasks and create links
        for (const task of newTasks) {
          await taskRepository.createAsync(task);
          
          const link = new TaskRecurringLink(
            recurringTask.id,
            task.id,
            task.dueDate!
          );
          await taskRecurringLinkRepository.createAsync(link.toObject());
          
          result.generatedCount++;
        }

      } catch (error) {
        result.errorCount++;
        result.errors.push(`Error processing recurring task ${recurringTask.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

  } catch (error) {
    result.errorCount++;
    result.errors.push(`Batch generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Calculate the next occurrence date from a given date
 */
function calculateNextOccurrence(
  fromDate: Date,
  intervals: IRecurringTask['intervals']
): Date {
  if (!intervals || intervals.length === 0) {
    return new Date(fromDate.getTime() + MAX_ADVANCE_PERIOD_MS);
  }

  const interval = intervals[0];
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
  }

  return nextDate;
}
