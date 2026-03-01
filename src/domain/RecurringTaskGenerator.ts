import type { IRecurrenceTemplate } from '../interfaces/IRecurrenceTemplate.js';
import type { ITask } from '../interfaces/ITask.js';
import { RecurrenceCalculator } from './RecurrenceCalculator.js';
import { generateGuid } from '../utils/index.js';

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
   * Generate the next instance of a recurring task
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
   * Check if a task can generate a next instance
   * @param task - The task to check
   * @returns true if the task has a recurrence template
   */
  canGenerateNextInstance(task: ITask): boolean {
    return !!task.recurrenceTemplateId;
  }
}
