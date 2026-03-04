import type { IUnitOfWork, ITaskRepository, ICategoryRepository, IRecurrenceTemplateRepository, IRecurringTaskRepository, ITaskRecurringLinkRepository, ITaskDependencyRepository, ITaskCategoryAssignmentEntity, ITaskEntity } from '../../interfaces/index.js';
import type { ILocalStorageAdapter } from '../adapters/ILocalStorageAdapter.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { CategoryRepository } from '../repositories/CategoryRepository.js';
import { RecurrenceTemplateRepository } from '../repositories/RecurrenceTemplateRepository.js';
import { RecurringTaskRepository } from '../repositories/RecurringTaskRepository.js';
import { TaskRecurringLinkRepository } from '../repositories/TaskRecurringLinkRepository.js';
import { TaskDependencyRepository } from '../repositories/TaskDependencyRepository.js';
import { EStatus } from '../../enums/EStatus.js';
import type { EEntityType } from '../../enums/EEntityType.js';

/**
 * Change tracking entry with type metadata
 */
interface ChangeEntry {
  entity: unknown;
  type: 'new' | 'modified' | 'deleted';
  entityType: EEntityType;
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
  private readonly taskDependencyRepository: TaskDependencyRepository;
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
    this.taskDependencyRepository = new TaskDependencyRepository(storage);
  }

  /**
   * Initialize the UnitOfWork, including loading default recurrence templates
   */
  async initializeAsync(): Promise<void> {
    await this.recurrenceTemplateRepository.initializeAsync();
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
   * Get the TaskDependency repository
   */
  getTaskDependencyRepository(): ITaskDependencyRepository {
    return this.taskDependencyRepository;
  }

  /**
   * Assign a task to a category
   */
  async assignTaskToCategoryAsync(taskId: string, categoryId: string): Promise<ITaskCategoryAssignmentEntity | null> {
    return this.categoryRepository.assignTaskToCategoryAsync(taskId, categoryId);
  }

  /**
   * Remove a task from a category
   */
  async removeTaskFromCategoryAsync(taskId: string, categoryId: string): Promise<boolean> {
    return this.categoryRepository.removeTaskFromCategoryAsync(taskId, categoryId);
  }

  /**
   * Complete a task with optional recurrence generation
   * When a task with a recurrenceTemplateId is completed, a new task instance is automatically generated
   * @param taskId - ID of the task to complete
   * @returns The newly generated task if recurrence was created, null otherwise
   */
  async completeTaskWithRecurrenceAsync(taskId: string): Promise<ITaskEntity | null> {
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
    let newRecurringTask: ITaskEntity | null = null;
    const links = this.taskRecurringLinkRepository.getByTaskId(taskData.id);
    if (links.length > 0) {
      newRecurringTask = await this.generateNextRecurringTask(taskData);
      if (newRecurringTask) {
        // Register main task
        this.registerNew(newRecurringTask, 'task');

        // Register subtasks if any
        const subtasks = (newRecurringTask as any)._subtasks as ITaskEntity[] | undefined;
        if (subtasks && subtasks.length > 0) {
          const { generateGuid } = await import('../../utils/index.js');
          const { EDependencyType } = await import('../../enums/EDependencyType.js');

          for (const subtask of subtasks) {
            this.registerNew(subtask, 'task');

            // Create TaskDependency linking subtask to parent
            const dependency = {
              id: generateGuid(),
              taskId: subtask.id,
              dependsOnTaskId: newRecurringTask.id,
              dependencyType: EDependencyType.SUBTASK,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            this.registerNew(dependency, 'taskDependency');
          }
        }
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
  private async generateNextRecurringTask(completedTask: ITaskEntity): Promise<ITaskEntity | null> {
    // Get recurring task link to find the template
    const links = this.taskRecurringLinkRepository.getByTaskId(completedTask.id);
    if (links.length === 0) {
      return null;
    }

    const recurringTaskId = links[0].recurringTaskId;
    const recurringTask = await this.recurringTaskRepository.getByIdAsync(recurringTaskId);
    if (!recurringTask) {
      return null;
    }

    const templateId = recurringTask.recurrenceTemplateId;
    const template = await this.recurrenceTemplateRepository.getByIdAsync(templateId);
    if (!template) {
      return null;
    }

    // Calculate next occurrence date - this becomes the startDate
    const currentStartDate = completedTask.startDate ? new Date(completedTask.startDate) : new Date();
    const nextStartDate = this.calculateNextOccurrence(template, currentStartDate);

    // Calculate dueDate: startDate + duration (if duration is specified in template)
    let nextDueDate: Date;
    if (template.duration && template.duration > 0) {
      nextDueDate = new Date(nextStartDate);
      nextDueDate.setDate(nextDueDate.getDate() + template.duration);
    } else {
      // If no duration, use the same as before (backward compatibility)
      nextDueDate = this.calculateNextOccurrence(template, completedTask.dueDate ? new Date(completedTask.dueDate) : new Date());
    }

    // Generate new task instance
    const { generateGuid } = await import('../../utils/index.js');
    const newTask: ITaskEntity = {
      id: generateGuid(),
      title: completedTask.title,
      description: completedTask.description,
      status: 'TODO' as EStatus,
      priority: completedTask.priority,
      // Use the recurrence date as startDate
      startDate: nextStartDate,
      dueDate: nextDueDate,
      tags: completedTask.tags ? [...completedTask.tags] : [],
      isSystemCreated: true, // Mark as system-created
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Generate subtasks if subtaskTemplates are defined (returns array to be registered by caller)
    const subtasks = template.subtaskTemplates && template.subtaskTemplates.length > 0
      ? await this.generateSubtasks(template.subtaskTemplates, newTask)
      : [];

    // Attach subtasks to return for caller to register
    (newTask as any)._subtasks = subtasks;

    return newTask;
  }

  /**
   * Generate subtasks from subtask templates
   * Returns array of subtasks to be registered
   */
  private async generateSubtasks(subtaskTemplates: { id: string; title: string; description?: string; priority?: import('../../enums/EPriority.js').EPriority; startDateOffset: number; duration?: number }[], parentTask: ITaskEntity): Promise<ITaskEntity[]> {
    const { generateGuid } = await import('../../utils/index.js');
    const subtasks: ITaskEntity[] = [];

    for (const subtaskTemplate of subtaskTemplates) {
      // Calculate subtask startDate: parent.startDate + offset
      const subtaskStartDate = new Date(parentTask.startDate);
      subtaskStartDate.setDate(subtaskStartDate.getDate() + subtaskTemplate.startDateOffset);

      // Calculate subtask dueDate
      let subtaskDueDate: Date;
      if (subtaskTemplate.duration && subtaskTemplate.duration > 0) {
        subtaskDueDate = new Date(subtaskStartDate);
        subtaskDueDate.setDate(subtaskDueDate.getDate() + subtaskTemplate.duration);
      } else {
        // Default: use parent's dueDate (but ensure it doesn't exceed parent dueDate)
        subtaskDueDate = new Date(parentTask.dueDate || parentTask.startDate);
      }

      // Ensure subtask dueDate doesn't exceed parent dueDate
      if (parentTask.dueDate && subtaskDueDate > new Date(parentTask.dueDate)) {
        subtaskDueDate = new Date(parentTask.dueDate);
      }

      // Create the subtask
      const subtask: ITaskEntity = {
        id: generateGuid(),
        title: subtaskTemplate.title,
        description: subtaskTemplate.description,
        status: 'TODO' as EStatus,
        priority: subtaskTemplate.priority ?? parentTask.priority,
        startDate: subtaskStartDate,
        dueDate: subtaskDueDate,
        tags: parentTask.tags ? [...parentTask.tags] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      subtasks.push(subtask);
    }

    return subtasks;
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
  registerNew(entity: unknown, entityType: EEntityType): void {
    this.assertNotCommitted();
    this.changes.push({ entity, type: 'new', entityType });
  }

  /**
   * Register a modified entity for update on commit
   * @param entity - Entity to register (must have id property)
   * @param entityType - Type of entity for routing to correct repository
   */
  registerModified(entity: unknown, entityType: EEntityType): void {
    this.assertNotCommitted();
    this.changes.push({ entity, type: 'modified', entityType });
  }

  /**
   * Register a deleted entity for deletion on commit
   * @param entity - Entity to register (must have id property)
   * @param entityType - Type of entity for routing to correct repository
   */
  registerDeleted(entity: unknown, entityType: EEntityType): void {
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
        console.log('[UnitOfWork] Committing change:', change.entityType, change.type, entityWithId.id);

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
          case 'taskDependency':
            await this.commitTaskDependencyChange(change.type, entityWithId);
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
      console.error('[UnitOfWork] Error during commit:', error);
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
   * Commit a task dependency change to the repository
   */
  private async commitTaskDependencyChange(type: 'new' | 'modified' | 'deleted', entity: { id: string }): Promise<void> {
    switch (type) {
      case 'new':
        await this.taskDependencyRepository.createAsync(entity as never);
        break;
      case 'modified':
        await this.taskDependencyRepository.updateAsync(entity.id, entity as never);
        break;
      case 'deleted':
        await this.taskDependencyRepository.deleteAsync(entity.id);
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
