import type { IRecurringTaskService } from '../interfaces/IRecurringTaskService.js';
import type { IRecurringTask, IRecurringTaskCreateDto, IRecurringTaskUpdateDto } from '../../interfaces/IRecurringTask.js';
import type { ITask } from '../../interfaces/ITask.js';
import type { IRecurringTaskRepository } from '../../interfaces/IRecurringTaskRepository.js';
import type { ITaskRepository } from '../../interfaces/ITaskRepository.js';
import type { IUnitOfWork } from '../../interfaces/IUnitOfWork.js';
import type { ITaskRecurringLinkRepository } from '../../interfaces/ITaskRecurringLinkRepository.js';
import { ERecurringTaskStatus } from '../../enums/ERecurringTaskStatus.js';
import { EStatus } from '../../enums/EStatus.js';
import { RecurringTask } from '../../domain/RecurringTask.js';
import { TaskRecurringLink } from '../../domain/TaskRecurringLink.js';
import { RecurringTaskGenerator } from '../../domain/RecurringTaskGenerator.js';

/**
 * RecurringTaskService Class
 * Implements business logic for recurring task operations
 */
export class RecurringTaskService implements IRecurringTaskService {
  private readonly unitOfWork: IUnitOfWork;
  private readonly recurringTaskRepository: IRecurringTaskRepository;
  private readonly taskRepository: ITaskRepository;
  private readonly taskRecurringLinkRepository: ITaskRecurringLinkRepository;
  private readonly generator: RecurringTaskGenerator;

  /**
   * Creates a new RecurringTaskService instance
   * @param unitOfWork - The UnitOfWork for data access
   */
  constructor(unitOfWork: IUnitOfWork) {
    this.unitOfWork = unitOfWork;
    this.recurringTaskRepository = unitOfWork.getRecurringTaskRepository();
    this.taskRepository = unitOfWork.getTaskRepository();
    this.taskRecurringLinkRepository = unitOfWork.getTaskRecurringLinkRepository();
    this.generator = new RecurringTaskGenerator();
  }

  /**
   * Create a new recurring task and generate initial task instances
   */
  async createAsync(dto: IRecurringTaskCreateDto): Promise<IRecurringTask> {
    // Validate title
    if (!dto.title || dto.title.trim() === '') {
      throw new Error('Recurring task title is required');
    }

    // Validate intervals
    if (!dto.intervals || dto.intervals.length === 0) {
      throw new Error('At least one interval is required');
    }

    // Validate start date
    if (!dto.startDate) {
      throw new Error('Start date is required');
    }

    // Create the recurring task
    const recurringTask = new RecurringTask(dto);
    const recurringTaskObj = recurringTask.toObject();

    // Register with UOW change tracking
    this.unitOfWork.registerNew(recurringTaskObj, 'recurringTask');
    await this.unitOfWork.commit();

    // Generate task instances
    const generatedTasks = this.generator.generateFromRecurringTask(recurringTaskObj);
    
    // Create junction links and register tasks
    for (const task of generatedTasks) {
      // Skip tasks without due dates (shouldn't happen but be defensive)
      if (!task.dueDate) {
        continue;
      }

      // Register task
      this.unitOfWork.registerNew(task, 'task');
      
      // Create junction link
      const link = new TaskRecurringLink(
        recurringTaskObj.id,
        task.id,
        task.dueDate
      );
      this.unitOfWork.registerNew(link.toObject(), 'taskRecurringLink');
    }

    await this.unitOfWork.commit();

    return recurringTaskObj;
  }

  /**
   * Update an existing recurring task and sync linked tasks
   */
  async updateAsync(id: string, dto: IRecurringTaskUpdateDto): Promise<IRecurringTask | null> {
    const existing = await this.recurringTaskRepository.getByIdAsync(id);
    if (!existing) {
      return null;
    }

    // Validate title if provided
    if (dto.title !== undefined && (!dto.title || dto.title.trim() === '')) {
      throw new Error('Recurring task title cannot be empty');
    }

    const now = new Date().toISOString();

    // Check if interval changed (requires regeneration)
    const intervalsChanged = dto.intervals !== undefined && 
      JSON.stringify(dto.intervals) !== JSON.stringify(existing.intervals);

    // Update the recurring task
    const updatedRecurringTask: IRecurringTask = {
      ...existing,
      title: dto.title !== undefined ? dto.title.trim() : existing.title,
      description: dto.description !== undefined ? dto.description?.trim() : existing.description,
      priority: dto.priority !== undefined ? dto.priority : existing.priority,
      startDate: dto.startDate !== undefined ? dto.startDate : existing.startDate,
      endDate: dto.endDate !== undefined ? dto.endDate : existing.endDate,
      intervals: dto.intervals !== undefined ? [...dto.intervals] : [...existing.intervals],
      tags: dto.tags !== undefined ? [...dto.tags] : [...(existing.tags || [])],
      categoryIds: dto.categoryIds !== undefined ? [...dto.categoryIds] : [...(existing.categoryIds || [])],
      status: dto.status !== undefined ? dto.status : existing.status,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedRecurringTask, 'recurringTask');

    // If intervals changed, regenerate future tasks
    if (intervalsChanged) {
      await this.regenerateFutureTasks(updatedRecurringTask);
    } else if (dto.title !== undefined || dto.description !== undefined || 
               dto.priority !== undefined || dto.tags !== undefined || dto.categoryIds !== undefined) {
      // Just update linked tasks with new properties
      await this.updateLinkedTasks(updatedRecurringTask);
    }

    await this.unitOfWork.commit();

    return updatedRecurringTask;
  }

  /**
   * Stop an active recurring task
   */
  async stopAsync(id: string): Promise<IRecurringTask | null> {
    return this.updateAsync(id, { status: ERecurringTaskStatus.STOPPED });
  }

  /**
   * Reactivate a stopped recurring task
   */
  async reactivateAsync(id: string): Promise<IRecurringTask | null> {
    const existing = await this.recurringTaskRepository.getByIdAsync(id);
    if (!existing || existing.status !== ERecurringTaskStatus.STOPPED) {
      return null;
    }

    // Update to active and generate new tasks from current date
    const updated = await this.updateAsync(id, { status: ERecurringTaskStatus.ACTIVE });
    
    if (updated) {
      // Generate new tasks from now
      const recurringTask = { ...updated, startDate: new Date() };
      const generatedTasks = this.generator.generateFromRecurringTask(recurringTask);
      
      for (const task of generatedTasks) {
        if (!task.dueDate) continue;
        this.unitOfWork.registerNew(task, 'task');
        const link = new TaskRecurringLink(updated.id, task.id, task.dueDate);
        this.unitOfWork.registerNew(link.toObject(), 'taskRecurringLink');
      }
      
      await this.unitOfWork.commit();
    }

    return updated;
  }

  /**
   * Get a recurring task by ID
   */
  async getByIdAsync(id: string): Promise<IRecurringTask | null> {
    return this.recurringTaskRepository.getByIdAsync(id);
  }

  /**
   * Get all recurring tasks
   */
  async getAllAsync(): Promise<IRecurringTask[]> {
    return this.recurringTaskRepository.getAllAsync();
  }

  /**
   * Get recurring tasks by status
   */
  async getByStatusAsync(status: ERecurringTaskStatus): Promise<IRecurringTask[]> {
    return this.recurringTaskRepository.getByStatusAsync(status);
  }

  /**
   * Get all active recurring tasks
   */
  async getActiveAsync(): Promise<IRecurringTask[]> {
    return this.recurringTaskRepository.getActiveAsync();
  }

  /**
   * Get all tasks linked to a recurring task
   */
  async getLinkedTasksAsync(recurringTaskId: string): Promise<ITask[]> {
    const links = await this.taskRecurringLinkRepository.getByRecurringTaskIdAsync(recurringTaskId);
    const tasks: ITask[] = [];
    
    for (const link of links) {
      const task = await this.taskRepository.getByIdAsync(link.taskId);
      if (task) {
        tasks.push(task);
      }
    }
    
    return tasks;
  }

  /**
   * Delete a recurring task and all its linked tasks
   */
  async deleteAsync(id: string): Promise<boolean> {
    const existing = await this.recurringTaskRepository.getByIdAsync(id);
    if (!existing) {
      return false;
    }

    // Get all linked tasks
    const links = await this.taskRecurringLinkRepository.getByRecurringTaskIdAsync(id);
    
    // Delete linked tasks
    for (const link of links) {
      const task = await this.taskRepository.getByIdAsync(link.taskId);
      if (task) {
        this.unitOfWork.registerDeleted(task, 'task');
      }
    }

    // Delete junction links
    await this.taskRecurringLinkRepository.deleteByRecurringTaskId(id);

    // Delete the recurring task
    this.unitOfWork.registerDeleted(existing, 'recurringTask');
    await this.unitOfWork.commit();

    return true;
  }

  /**
   * Regenerate future tasks when interval changes
   */
  private async regenerateFutureTasks(recurringTask: IRecurringTask): Promise<void> {
    const links = await this.taskRecurringLinkRepository.getByRecurringTaskIdAsync(recurringTask.id);
    const now = new Date();

    // Delete non-done linked tasks and their links
    for (const link of links) {
      const task = await this.taskRepository.getByIdAsync(link.taskId);
      if (task && task.status !== EStatus.DONE) {
        this.unitOfWork.registerDeleted(task, 'task');
        await this.taskRecurringLinkRepository.deleteByTaskId(task.id);
      }
    }

    // Generate new tasks from current date
    const recurringTaskWithCurrentStart = { 
      ...recurringTask, 
      startDate: now 
    };
    const generatedTasks = this.generator.generateFromRecurringTask(recurringTaskWithCurrentStart);

    for (const task of generatedTasks) {
      if (!task.dueDate) continue;
      this.unitOfWork.registerNew(task, 'task');
      const link = new TaskRecurringLink(recurringTask.id, task.id, task.dueDate);
      this.unitOfWork.registerNew(link.toObject(), 'taskRecurringLink');
    }
  }

  /**
   * Update linked tasks when only properties change (not interval)
   */
  private async updateLinkedTasks(recurringTask: IRecurringTask): Promise<void> {
    const links = await this.taskRecurringLinkRepository.getByRecurringTaskIdAsync(recurringTask.id);
    const now = new Date().toISOString();

    for (const link of links) {
      const task = await this.taskRepository.getByIdAsync(link.taskId);
      // Only update non-done tasks
      if (task && task.status !== EStatus.DONE) {
        const updatedTask: ITask = {
          ...task,
          title: recurringTask.title,
          description: recurringTask.description,
          priority: recurringTask.priority,
          tags: recurringTask.tags ? [...recurringTask.tags] : [],
          updatedAt: now,
        };
        this.unitOfWork.registerModified(updatedTask, 'task');
      }
    }
  }
}
