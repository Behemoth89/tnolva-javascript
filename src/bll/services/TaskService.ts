import type { ITaskService } from '../interfaces/ITaskService.js';
import type { IBllTaskDto, IBllTaskCreateDto, IBllTaskUpdateDto } from '../interfaces/dtos/index.js';
import type { ITaskEntity, IUnitOfWork, ITaskRepository, ITaskDependencyRepository, ICategoryRepository } from '../../interfaces/index.js';
import { EStatus } from '../../enums/EStatus.js';
import { EPriority } from '../../enums/EPriority.js';
import { generateGuid } from '../../utils/index.js';
import { TaskDependencyService } from './TaskDependencyService.js';

/**
 * TaskService Class
 * Implements business logic for task operations
 * Uses BLL DTOs and handles category assignment
 */
export class TaskService implements ITaskService {
  private readonly unitOfWork: IUnitOfWork;
  private readonly taskRepository: ITaskRepository;
  private readonly categoryRepository: ICategoryRepository;
  private readonly taskDependencyService: TaskDependencyService;
  private readonly taskDependencyRepository: ITaskDependencyRepository;

  /**
   * Creates a new TaskService instance
   * @param unitOfWork - The UnitOfWork for data access
   */
  constructor(unitOfWork: IUnitOfWork) {
    this.unitOfWork = unitOfWork;
    this.taskRepository = unitOfWork.getTaskRepository();
    this.categoryRepository = unitOfWork.getCategoryRepository();
    this.taskDependencyRepository = unitOfWork.getTaskDependencyRepository();
    this.taskDependencyService = new TaskDependencyService(unitOfWork);
  }

  /**
   * Map ITaskEntity to IBllTaskDto with category info
   */
  private async mapToBllTaskDto(task: ITaskEntity): Promise<IBllTaskDto> {
    const assignment = await this.categoryRepository.getAssignmentForTaskAsync(task.id);
    let categoryId: string | undefined;
    let categoryName: string | undefined;
    let categoryColor: string | undefined;

    if (assignment) {
      categoryId = assignment.categoryId;
      const categories = await this.categoryRepository.getCategoriesForTaskAsync(task.id);
      if (categories.length > 0) {
        const category = categories[0];
        categoryName = category.name;
        categoryColor = category.color;
      }
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate,
      dueDate: task.dueDate,
      tags: task.tags,
      categoryId,
      categoryName,
      categoryColor,
      isSystemCreated: task.isSystemCreated,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /**
   * Create a new task
   */
  async createAsync(dto: IBllTaskCreateDto): Promise<IBllTaskDto> {
    // Validate title
    if (!dto.title || dto.title.trim() === '') {
      throw new Error('Task title is required');
    }

    // Validate startDate is not after dueDate
    if (dto.startDate && dto.dueDate) {
      const startDate = new Date(dto.startDate);
      const dueDate = new Date(dto.dueDate);
      if (startDate > dueDate) {
        throw new Error('Start date cannot be after due date');
      }
    }

    // Generate ID if not provided
    const id = dto.id || generateGuid();
    const now = new Date().toISOString();

    const task: ITaskEntity = {
      id,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      status: dto.status ?? EStatus.TODO,
      priority: dto.priority ?? EPriority.MEDIUM,
      // startDate defaults to current timestamp if not specified
      startDate: dto.startDate ?? new Date(),
      dueDate: dto.dueDate,
      tags: dto.tags ? [...dto.tags] : [],
      isSystemCreated: dto.isSystemCreated ?? false,
      createdAt: dto.createdAt ?? now,
      updatedAt: dto.updatedAt ?? now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerNew(task, 'task');
    
    // Handle category assignment if categoryId is provided
    if (dto.categoryId) {
      await this.categoryRepository.assignTaskToCategoryAsync(id, dto.categoryId);
    }
    
    await this.unitOfWork.commit();
    
    return this.mapToBllTaskDto(task);
  }

  /**
   * Update an existing task
   * @throws Error if task is completed (done lock)
   */
  async updateAsync(id: string, dto: IBllTaskUpdateDto): Promise<IBllTaskDto | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return null;
    }

    // Check done lock - cannot modify completed tasks
    if (task.status === EStatus.DONE) {
      throw new Error('Cannot modify completed task');
    }

    // Validate title if provided
    if (dto.title !== undefined && (!dto.title || dto.title.trim() === '')) {
      throw new Error('Task title cannot be empty');
    }

    // Determine new startDate and dueDate for validation
    const newStartDate = dto.startDate !== undefined ? dto.startDate : task.startDate;
    const newDueDate = dto.dueDate !== undefined ? dto.dueDate : task.dueDate;

    // Validate startDate is not after dueDate
    if (newStartDate && newDueDate) {
      const startDate = new Date(newStartDate);
      const dueDate = new Date(newDueDate);
      if (startDate > dueDate) {
        throw new Error('Start date cannot be after due date');
      }
    }

    // Check dependency validation if status is being set to DONE
    if (dto.status !== undefined && dto.status === EStatus.DONE) {
      const canComplete = await this.taskDependencyService.canCompleteMainTaskAsync(id);
      if (!canComplete) {
        const subtasks = await this.taskDependencyService.getSubtasksAsync(id);
        const incompleteSubtasks = subtasks
          .filter(s => s.status !== EStatus.DONE)
          .map(s => s.title)
          .join(', ');
        throw new Error(`Cannot complete main task: incomplete subtasks - ${incompleteSubtasks}`);
      }
    }

    const now = new Date().toISOString();

    const updatedTask: ITaskEntity = {
      ...task,
      title: dto.title !== undefined ? dto.title.trim() : task.title,
      description: dto.description !== undefined ? dto.description?.trim() : task.description,
      status: dto.status !== undefined ? dto.status : task.status,
      priority: dto.priority !== undefined ? dto.priority : task.priority,
      startDate: dto.startDate !== undefined ? dto.startDate : task.startDate,
      dueDate: dto.dueDate !== undefined ? dto.dueDate : task.dueDate,
      tags: dto.tags !== undefined ? [...dto.tags] : task.tags,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');

    // Handle category changes
    if (dto.categoryId !== undefined) {
      // Get current assignment
      const currentAssignment = await this.categoryRepository.getAssignmentForTaskAsync(id);
      
      if (dto.categoryId === null) {
        // Clear category - delete existing assignment
        if (currentAssignment) {
          await this.categoryRepository.deleteAssignmentForTaskAsync(id);
        }
      } else if (dto.categoryId !== currentAssignment?.categoryId) {
        // Category changed - delete old and create new
        if (currentAssignment) {
          await this.categoryRepository.deleteAssignmentForTaskAsync(id);
        }
        await this.categoryRepository.assignTaskToCategoryAsync(id, dto.categoryId);
      }
      // If categoryId is same as current, do nothing
    }
    
    await this.unitOfWork.commit();
    
    return this.mapToBllTaskDto(updatedTask);
  }

  /**
   * Delete a task
   * @throws Error if task is completed (done lock)
   */
  async deleteAsync(id: string): Promise<boolean> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return false;
    }

    // Check done lock - cannot delete completed tasks
    if (task.status === EStatus.DONE) {
      throw new Error('Cannot delete completed task');
    }

    // Get dependencies to delete (both as subtask and as parent)
    const dependenciesAsSubtask = await this.taskDependencyRepository.getDependenciesForTaskAsync(id);
    const dependenciesAsParent = await this.taskDependencyRepository.getDependentsAsync(id);
    const allDependencies = [...dependenciesAsSubtask, ...dependenciesAsParent];

    // Delete category assignment first
    await this.categoryRepository.deleteAssignmentForTaskAsync(id);

    // Register task deletion with UOW
    this.unitOfWork.registerDeleted(task, 'task');

    // Register dependency deletions with UOW (cascade delete)
    for (const dependency of allDependencies) {
      this.unitOfWork.registerDeleted(dependency, 'taskDependency');
    }

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
  async getByIdAsync(id: string): Promise<IBllTaskDto | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return null;
    }
    return this.mapToBllTaskDto(task);
  }

  /**
   * Get all tasks
   */
  async getAllAsync(): Promise<IBllTaskDto[]> {
    const tasks = await this.taskRepository.getAllAsync();
    return Promise.all(tasks.map(task => this.mapToBllTaskDto(task)));
  }

  /**
   * Start a TODO task - transitions to IN_PROGRESS
   */
  async startAsync(id: string): Promise<IBllTaskDto | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task || task.status !== EStatus.TODO) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedTask: ITaskEntity = {
      ...task,
      status: EStatus.IN_PROGRESS,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return this.mapToBllTaskDto(updatedTask);
  }

  /**
   * Complete an IN_PROGRESS task - transitions to DONE
   */
  async completeAsync(id: string): Promise<IBllTaskDto | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task || task.status !== EStatus.IN_PROGRESS) {
      return null;
    }

    // Check if all subtasks are done before completing main task
    const canComplete = await this.taskDependencyService.canCompleteMainTaskAsync(id);
    if (!canComplete) {
      const subtasks = await this.taskDependencyService.getSubtasksAsync(id);
      const incompleteSubtasks = subtasks
        .filter(s => s.status !== EStatus.DONE)
        .map(s => s.title)
        .join(', ');
      throw new Error(`Cannot complete main task: incomplete subtasks - ${incompleteSubtasks}`);
    }

    const now = new Date().toISOString();
    const updatedTask: ITaskEntity = {
      ...task,
      status: EStatus.DONE,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return this.mapToBllTaskDto(updatedTask);
  }

  /**
   * Cancel any task - transitions to CANCELLED
   */
  async cancelAsync(id: string): Promise<IBllTaskDto | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedTask: ITaskEntity = {
      ...task,
      status: EStatus.CANCELLED,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return this.mapToBllTaskDto(updatedTask);
  }

  /**
   * Add a tag to a task
   */
  async addTagAsync(id: string, tag: string): Promise<IBllTaskDto | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return null;
    }

    const trimmedTag = tag.trim();
    if (!trimmedTag) {
      return this.mapToBllTaskDto(task);
    }

    const tags = task.tags ?? [];
    const now = new Date().toISOString();

    // Don't add duplicates
    if (tags.includes(trimmedTag)) {
      return this.mapToBllTaskDto(task);
    }

    const updatedTask: ITaskEntity = {
      ...task,
      tags: [...tags, trimmedTag],
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return this.mapToBllTaskDto(updatedTask);
  }

  /**
   * Remove a tag from a task
   */
  async removeTagAsync(id: string, tag: string): Promise<IBllTaskDto | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return null;
    }

    const trimmedTag = tag.trim();
    const tags = task.tags ?? [];

    if (!tags.includes(trimmedTag)) {
      return this.mapToBllTaskDto(task);
    }

    const now = new Date().toISOString();
    const updatedTask: ITaskEntity = {
      ...task,
      tags: tags.filter(t => t !== trimmedTag),
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return this.mapToBllTaskDto(updatedTask);
  }

  /**
   * Change the priority of a task
   */
  async changePriorityAsync(id: string, priority: EPriority): Promise<IBllTaskDto | null> {
    const task = await this.taskRepository.getByIdAsync(id);
    if (!task) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedTask: ITaskEntity = {
      ...task,
      priority,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedTask, 'task');
    await this.unitOfWork.commit();
    
    return this.mapToBllTaskDto(updatedTask);
  }

  /**
   * Get all tasks with a specific status
   */
  async getByStatusAsync(status: EStatus): Promise<IBllTaskDto[]> {
    const tasks = await this.taskRepository.getByStatusAsync(status);
    return Promise.all(tasks.map(task => this.mapToBllTaskDto(task)));
  }

  /**
   * Get all tasks with a specific priority
   */
  async getByPriorityAsync(priority: EPriority): Promise<IBllTaskDto[]> {
    const tasks = await this.taskRepository.getByPriorityAsync(priority);
    return Promise.all(tasks.map(task => this.mapToBllTaskDto(task)));
  }

  /**
   * Check if a task is linked to a recurring task
   * @param taskId - The task ID to check
   * @returns true if the task has a recurring task source
   */
  async isLinkedToRecurringTask(taskId: string): Promise<boolean> {
    const linkRepo = this.unitOfWork.getTaskRecurringLinkRepository();
    const links = await linkRepo.getByTaskIdAsync(taskId);
    return links.length > 0;
  }

  /**
   * Get the recurring task ID linked to a task
   * @param taskId - The task ID
   * @returns The recurring task ID if linked, null otherwise
   */
  async getLinkedRecurringTaskId(taskId: string): Promise<string | null> {
    const linkRepo = this.unitOfWork.getTaskRecurringLinkRepository();
    const links = await linkRepo.getByTaskIdAsync(taskId);
    return links.length > 0 ? links[0].recurringTaskId : null;
  }
}
