import type { ITaskService } from '../interfaces/ITaskService.js';
import type { ITask } from '../../interfaces/ITask.js';
import type { ITaskCreateDto } from '../../interfaces/ITaskCreateDto.js';
import type { ITaskUpdateDto } from '../../interfaces/ITaskUpdateDto.js';
import type { IUnitOfWork } from '../../interfaces/IUnitOfWork.js';
import type { ITaskRepository } from '../../interfaces/ITaskRepository.js';
import { EStatus } from '../../enums/EStatus.js';
import { EPriority } from '../../enums/EPriority.js';
import { generateGuid } from '../../utils/index.js';

/**
 * TaskService Class
 * Implements business logic for task operations
 */
export class TaskService implements ITaskService {
  private readonly unitOfWork: IUnitOfWork;
  private readonly taskRepository: ITaskRepository;

  /**
   * Creates a new TaskService instance
   * @param unitOfWork - The UnitOfWork for data access
   */
  constructor(unitOfWork: IUnitOfWork) {
    this.unitOfWork = unitOfWork;
    this.taskRepository = unitOfWork.getTaskRepository();
  }

  /**
   * Create a new task
   */
  async createAsync(dto: ITaskCreateDto): Promise<ITask> {
    // Validate title
    if (!dto.title || dto.title.trim() === '') {
      throw new Error('Task title is required');
    }

    // Generate ID if not provided
    const id = dto.id || generateGuid();
    const now = new Date().toISOString();

    const task: ITask = {
      id,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      status: dto.status ?? EStatus.TODO,
      priority: dto.priority ?? EPriority.MEDIUM,
      dueDate: dto.dueDate,
      tags: dto.tags ? [...dto.tags] : [],
      recurrenceTemplateId: dto.recurrenceTemplateId,
      createdAt: dto.createdAt ?? now,
      updatedAt: dto.updatedAt ?? now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerNew(task, 'task');
    await this.unitOfWork.commit();
    
    return task;
  }

  /**
   * Update an existing task
   */
  async updateAsync(id: string, dto: ITaskUpdateDto): Promise<ITask | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return null;
    }

    // Validate title if provided
    if (dto.title !== undefined && (!dto.title || dto.title.trim() === '')) {
      throw new Error('Task title cannot be empty');
    }

    const now = new Date().toISOString();

    const updatedTask: ITask = {
      ...task,
      title: dto.title !== undefined ? dto.title.trim() : task.title,
      description: dto.description !== undefined ? dto.description?.trim() : task.description,
      status: dto.status !== undefined ? dto.status : task.status,
      priority: dto.priority !== undefined ? dto.priority : task.priority,
      dueDate: dto.dueDate !== undefined ? dto.dueDate : task.dueDate,
      tags: dto.tags !== undefined ? [...dto.tags] : task.tags,
      recurrenceTemplateId: dto.recurrenceTemplateId !== undefined 
        ? dto.recurrenceTemplateId 
        : task.recurrenceTemplateId,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return updatedTask;
  }

  /**
   * Delete a task
   */
  async deleteAsync(id: string): Promise<boolean> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return false;
    }

    // Register with UOW change tracking
    this.unitOfWork.registerDeleted(task, 'task');
    try {
      await this.unitOfWork.commit();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get a task by ID
   */
  async getByIdAsync(id: string): Promise<ITask | null> {
    return this.taskRepository.getByIdAsync(id);
  }

  /**
   * Get all tasks
   */
  async getAllAsync(): Promise<ITask[]> {
    return this.taskRepository.getAllAsync();
  }

  /**
   * Start a TODO task - transitions to IN_PROGRESS
   */
  async startAsync(id: string): Promise<ITask | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task || task.status !== EStatus.TODO) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedTask: ITask = {
      ...task,
      status: EStatus.IN_PROGRESS,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return updatedTask;
  }

  /**
   * Complete an IN_PROGRESS task - transitions to DONE
   */
  async completeAsync(id: string): Promise<ITask | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task || task.status !== EStatus.IN_PROGRESS) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedTask: ITask = {
      ...task,
      status: EStatus.DONE,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return updatedTask;
  }

  /**
   * Cancel any task - transitions to CANCELLED
   */
  async cancelAsync(id: string): Promise<ITask | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedTask: ITask = {
      ...task,
      status: EStatus.CANCELLED,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return updatedTask;
  }

  /**
   * Add a tag to a task
   */
  async addTagAsync(id: string, tag: string): Promise<ITask | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return null;
    }

    const trimmedTag = tag.trim();
    if (!trimmedTag) {
      return task;
    }

    const tags = task.tags ?? [];
    const now = new Date().toISOString();

    // Don't add duplicates
    if (tags.includes(trimmedTag)) {
      return task;
    }

    const updatedTask: ITask = {
      ...task,
      tags: [...tags, trimmedTag],
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return updatedTask;
  }

  /**
   * Remove a tag from a task
   */
  async removeTagAsync(id: string, tag: string): Promise<ITask | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return null;
    }

    const trimmedTag = tag.trim();
    const tags = task.tags ?? [];

    if (!tags.includes(trimmedTag)) {
      return task;
    }

    const now = new Date().toISOString();
    const updatedTask: ITask = {
      ...task,
      tags: tags.filter(t => t !== trimmedTag),
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return updatedTask;
  }

  /**
   * Change the priority of a task
   */
  async changePriorityAsync(id: string, priority: EPriority): Promise<ITask | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedTask: ITask = {
      ...task,
      priority,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return updatedTask;
  }

  /**
   * Get all tasks with a specific status
   */
  async getByStatusAsync(status: EStatus): Promise<ITask[]> {
    return this.taskRepository.getByStatusAsync(status);
  }

  /**
   * Get all tasks with a specific priority
   */
  async getByPriorityAsync(priority: EPriority): Promise<ITask[]> {
    return this.taskRepository.getByPriorityAsync(priority);
  }
}
