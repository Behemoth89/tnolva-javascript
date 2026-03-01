import type { IUnitOfWork } from '../../interfaces/IUnitOfWork.js';
import type { ITaskRepository } from '../../interfaces/ITaskRepository.js';
import type { ICategoryRepository } from '../../interfaces/ICategoryRepository.js';
import type { IRecurrenceTemplateRepository } from '../../interfaces/IRecurrenceTemplateRepository.js';
import type { IRecurringTaskRepository } from '../../interfaces/IRecurringTaskRepository.js';
import type { ITaskRecurringLinkRepository } from '../../interfaces/ITaskRecurringLinkRepository.js';
import type { ITaskCategoryAssignment } from '../../interfaces/ITaskCategoryAssignment.js';
import type { ITask } from '../../interfaces/ITask.js';
import type { ILocalStorageAdapter } from '../adapters/ILocalStorageAdapter.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { CategoryRepository } from '../repositories/CategoryRepository.js';
import { RecurrenceTemplateRepository } from '../repositories/RecurrenceTemplateRepository.js';
import { RecurringTaskRepository } from '../repositories/RecurringTaskRepository.js';
import { TaskRecurringLinkRepository } from '../repositories/TaskRecurringLinkRepository.js';
import { EStatus } from '../../enums/EStatus.js';

/**
 * Entity type for routing changes to the correct repository
 */
export type EntityType = 'task' | 'category' | 'recurrenceTemplate' | 'recurringTask' | 'taskRecurringLink';

/**
 * Change tracking entry with type metadata
 */
interface ChangeEntry {
  entity: unknown;
  type: 'new' | 'modified' | 'deleted';
  entityType: EntityType;
}

/**
 * UnitOfWork Class
 * Coordinates multiple repository changes within a transaction scope
 */
export class UnitOfWork implements IUnitOfWork {
  private readonly taskRepository: TaskRepository;
  private readonly categoryRepository: CategoryRepository;
  private readonly recurrenceTemplateRepository: RecurrenceTemplateRepository;
  private readonly recurringTaskRepository: RecurringTaskRepository;
  private readonly taskRecurringLinkRepository: TaskRecurringLinkRepository;
  private changes: ChangeEntry[] = [];
  private committed = false;

  /**
   * Creates a new UnitOfWork instance
   * @param storage - Storage adapter
   */
  constructor(storage: ILocalStorageAdapter) {
    this.taskRepository = new TaskRepository(storage);
    this.categoryRepository = new CategoryRepository(storage);
    this.recurrenceTemplateRepository = new RecurrenceTemplateRepository(storage);
    this.recurringTaskRepository = new RecurringTaskRepository(storage);
    this.taskRecurringLinkRepository = new TaskRecurringLinkRepository(storage);
  }

  /**
   * Initialize the UnitOfWork, including loading default recurrence templates
   */
  async initialize(): Promise<void> {
    await this.recurrenceTemplateRepository.initialize();
  }

  /**
   * Get the Task repository
   */
  getTaskRepository(): ITaskRepository {
    return this.taskRepository;
  }

  /**
   * Get the Category repository
   */
  getCategoryRepository(): ICategoryRepository {
    return this.categoryRepository;
  }

  /**
   * Get the RecurrenceTemplate repository
   */
  getRecurrenceTemplateRepository(): IRecurrenceTemplateRepository {
    return this.recurrenceTemplateRepository;
  }

  /**
   * Get the RecurringTask repository
   */
  getRecurringTaskRepository(): IRecurringTaskRepository {
    return this.recurringTaskRepository;
  }

  /**
   * Get the TaskRecurringLink repository
   */
  getTaskRecurringLinkRepository(): ITaskRecurringLinkRepository {
    return this.taskRecurringLinkRepository;
  }

  /**
   * Assign a task to a category
   */
  async assignTaskToCategory(taskId: string, categoryId: string): Promise<ITaskCategoryAssignment | null> {
    return this.categoryRepository.assignTaskToCategory(taskId, categoryId);
  }

  /**
   * Remove a task from a category
   */
  async removeTaskFromCategory(taskId: string, categoryId: string): Promise<boolean> {
    return this.categoryRepository.removeTaskFromCategory(taskId, categoryId);
  }

  /**
   * Complete a task with optional recurrence generation
   * When a task with a recurrenceTemplateId is completed, a new task instance is automatically generated
   * @param taskId - ID of the task to complete
   * @returns The newly generated task if recurrence was created, null otherwise
   */
  async completeTaskWithRecurrence(taskId: string): Promise<ITask | null> {
    // Get the task
    const taskData = await this.taskRepository.getByIdAsync(taskId);
    if (!taskData) {
      return null;
    }

    // Mark task as completed - use change tracking
    taskData.status = EStatus.DONE;
    taskData.updatedAt = new Date().toISOString();
    this.registerModified(taskData, 'task');

    // Check if we need to generate a recurrence
    let newRecurringTask: ITask | null = null;
    if (taskData.recurrenceTemplateId) {
      newRecurringTask = await this.generateNextRecurringTask(taskData);
      if (newRecurringTask) {
        this.registerNew(newRecurringTask, 'task');
      }
    }

    // Commit all changes atomically
    await this.commit();

    return newRecurringTask;
  }

  /**
   * Generate the next recurring task instance
   * This is inlined here to avoid circular dependency between DAL and BLL layers
   */
  private async generateNextRecurringTask(completedTask: ITask): Promise<ITask | null> {
    if (!completedTask.recurrenceTemplateId) {
      return null;
    }

    const template = await this.recurrenceTemplateRepository.getByIdAsync(completedTask.recurrenceTemplateId);
    if (!template) {
      return null;
    }

    // Calculate next due date
    const currentDueDate = completedTask.dueDate ? new Date(completedTask.dueDate) : new Date();
    const nextDueDate = this.calculateNextOccurrence(template, currentDueDate);

    // Generate new task instance
    const { generateGuid } = await import('../../utils/index.js');
    const newTask: ITask = {
      id: generateGuid(),
      title: completedTask.title,
      description: completedTask.description,
      status: 'TODO' as EStatus,
      priority: completedTask.priority,
      dueDate: nextDueDate,
      tags: completedTask.tags ? [...completedTask.tags] : [],
      recurrenceTemplateId: completedTask.recurrenceTemplateId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newTask;
  }

  /**
   * Calculate the next occurrence date based on a recurrence template
   * Simplified version of RecurrenceService.calculateNextOccurrenceAsync
   */
  private calculateNextOccurrence(template: { intervals: { unit: string; value: number }[]; dayOfMonth?: number }, currentDate: Date): Date {
    let resultDate = new Date(currentDate);

    for (const interval of template.intervals) {
      switch (interval.unit) {
        case 'days':
          resultDate.setDate(resultDate.getDate() + interval.value);
          break;
        case 'weeks':
          resultDate.setDate(resultDate.getDate() + interval.value * 7);
          break;
        case 'months':
          this.addMonths(resultDate, interval.value, template.dayOfMonth);
          break;
        case 'years':
          resultDate.setFullYear(resultDate.getFullYear() + interval.value);
          break;
      }
    }

    return resultDate;
  }

  /**
   * Add months to a date, handling edge cases
   */
  private addMonths(date: Date, months: number, preferredDay?: number): void {
    const currentDay = date.getDate();
    const yearIncrease = Math.floor((date.getMonth() + months) / 12);
    const monthMod = (date.getMonth() + months) % 12;

    date.setDate(1);
    date.setMonth(monthMod);
    date.setFullYear(date.getFullYear() + yearIncrease);

    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const targetDay = preferredDay ?? currentDay;
    date.setDate(Math.min(targetDay, lastDayOfMonth));
  }

  /**
   * Register a new entity for insertion on commit
   * @param entity - Entity to register (must have id property)
   * @param entityType - Type of entity for routing to correct repository
   */
  registerNew(entity: unknown, entityType: EntityType): void {
    this.assertNotCommitted();
    this.changes.push({ entity, type: 'new', entityType });
  }

  /**
   * Register a modified entity for update on commit
   * @param entity - Entity to register (must have id property)
   * @param entityType - Type of entity for routing to correct repository
   */
  registerModified(entity: unknown, entityType: EntityType): void {
    this.assertNotCommitted();
    this.changes.push({ entity, type: 'modified', entityType });
  }

  /**
   * Register a deleted entity for deletion on commit
   * @param entity - Entity to register (must have id property)
   * @param entityType - Type of entity for routing to correct repository
   */
  registerDeleted(entity: unknown, entityType: EntityType): void {
    this.assertNotCommitted();
    this.changes.push({ entity, type: 'deleted', entityType });
  }

  /**
   * Commit all registered changes to storage atomically
   */
  async commit(): Promise<void> {
    this.assertNotCommitted();

    try {
      // For LocalStorage, we commit each change individually
      // In a real database, this would be a single transaction
      for (const change of this.changes) {
        const entityWithId = change.entity as { id: string };

        switch (change.entityType) {
          case 'task':
            await this.commitTaskChange(change.type, entityWithId);
            break;
          case 'category':
            await this.commitCategoryChange(change.type, entityWithId);
            break;
          case 'recurrenceTemplate':
            await this.commitRecurrenceTemplateChange(change.type, entityWithId);
            break;
          case 'recurringTask':
            await this.commitRecurringTaskChange(change.type, entityWithId);
            break;
          case 'taskRecurringLink':
            await this.commitTaskRecurringLinkChange(change.type, entityWithId);
            break;
        }
      }

      this.committed = true;
      this.changes = [];
    } catch (error) {
      // Note: On error, some changes may have been persisted while others failed,
      // potentially leaving inconsistent state. The changes array is cleared to
      // prevent re-attempting the same failed operations. committed remains false
      // to allow caller to handle recovery (retry or rollback).
      this.changes = [];
      throw error;
    }
  }

  /**
   * Commit a task change to the repository
   */
  private async commitTaskChange(type: 'new' | 'modified' | 'deleted', entity: { id: string }): Promise<void> {
    switch (type) {
      case 'new':
        await this.taskRepository.createAsync(entity as never);
        break;
      case 'modified':
        await this.taskRepository.updateAsync(entity.id, entity as never);
        break;
      case 'deleted':
        await this.taskRepository.deleteAsync(entity.id);
        break;
    }
  }

  /**
   * Commit a category change to the repository
   */
  private async commitCategoryChange(type: 'new' | 'modified' | 'deleted', entity: { id: string }): Promise<void> {
    switch (type) {
      case 'new':
        await this.categoryRepository.createAsync(entity as never);
        break;
      case 'modified':
        await this.categoryRepository.updateAsync(entity.id, entity as never);
        break;
      case 'deleted':
        await this.categoryRepository.deleteAsync(entity.id);
        break;
    }
  }

  /**
   * Commit a recurrence template change to the repository
   */
  private async commitRecurrenceTemplateChange(type: 'new' | 'modified' | 'deleted', entity: { id: string }): Promise<void> {
    switch (type) {
      case 'new':
        await this.recurrenceTemplateRepository.createAsync(entity as never);
        break;
      case 'modified':
        await this.recurrenceTemplateRepository.updateAsync(entity.id, entity as never);
        break;
      case 'deleted':
        await this.recurrenceTemplateRepository.deleteAsync(entity.id);
        break;
    }
  }

  /**
   * Commit a recurring task change to the repository
   */
  private async commitRecurringTaskChange(type: 'new' | 'modified' | 'deleted', entity: { id: string }): Promise<void> {
    switch (type) {
      case 'new':
        await this.recurringTaskRepository.createAsync(entity as never);
        break;
      case 'modified':
        await this.recurringTaskRepository.updateAsync(entity.id, entity as never);
        break;
      case 'deleted':
        await this.recurringTaskRepository.deleteAsync(entity.id);
        break;
    }
  }

  /**
   * Commit a task-recurring link change to the repository
   */
  private async commitTaskRecurringLinkChange(type: 'new' | 'modified' | 'deleted', entity: { id: string }): Promise<void> {
    switch (type) {
      case 'new':
        await this.taskRecurringLinkRepository.createAsync(entity as never);
        break;
      case 'modified':
        await this.taskRecurringLinkRepository.updateAsync(entity.id, entity as never);
        break;
      case 'deleted':
        await this.taskRecurringLinkRepository.deleteAsync(entity.id);
        break;
    }
  }

  /**
   * Discard all registered changes without modifying storage
   */
  rollback(): void {
    this.changes = [];
    this.committed = false;
  }

  /**
   * Assert that the unit of work has not been committed
   */
  private assertNotCommitted(): void {
    if (this.committed) {
      throw new Error('This UnitOfWork has already been committed');
    }
  }
}
