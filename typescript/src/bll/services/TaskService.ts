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
      completionDate: task.completionDate,
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
      completionDate: dto.completionDate,
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

    // Check done lock - cannot modify completed tasks except to change status away from DONE
    if (task.status === EStatus.DONE) {
      // Allow changing status away from DONE (to clear completionDate)
      // Also allow modifying completionDate while keeping status as DONE
      const isChangingStatusAwayFromDone = 
        dto.status !== undefined && 
        dto.status !== EStatus.DONE;
      // Allow if status remains DONE (whether sent from UI or not) and completionDate is being modified
      const isModifyingCompletionDateAndStatusStaysDone = 
        dto.completionDate !== undefined && 
        (dto.status === undefined || dto.status === EStatus.DONE);
      
      if (!isChangingStatusAwayFromDone && !isModifyingCompletionDateAndStatusStaysDone) {
        throw new Error('Cannot modify completed task');
      }
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

    // Determine effective status - handle case where user sets completionDate but not status
    let effectiveStatus = dto.status;
    const userProvidedCompletionDate = dto.completionDate !== undefined;
    
    // If user provides completionDate but not status, and task is not already done,
    // auto-set status to DONE
    if (effectiveStatus === undefined && userProvidedCompletionDate && dto.completionDate !== null) {
      if (task.status !== EStatus.DONE) {
        effectiveStatus = EStatus.DONE;
      }
    }

    // Check dependency validation if status is being set to DONE
    if (effectiveStatus !== undefined && effectiveStatus === EStatus.DONE) {
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

    // Handle completionDate logic
    // We need to distinguish between:
    // - undefined: user didn't provide completionDate
    // - null: user explicitly wants to clear completionDate
    // - Date: user explicitly set a completion date
    const completionDateProvided = dto.completionDate !== undefined;
    const completionDateExplicitlyCleared = dto.completionDate === null;
    // Use proper type check that works for both Date objects and date strings (from JSON deserialization)
    const completionDateSetToValue = dto.completionDate !== null && dto.completionDate !== undefined;
    
    let completionDate: Date | undefined = task.completionDate;
    const newStatus = effectiveStatus !== undefined ? effectiveStatus : task.status;
    const wasDone = task.status === EStatus.DONE;
    const isNowDone = newStatus === EStatus.DONE;
    
    // Case 1: Status is set to DONE (explicitly or via auto-DONE)
    if (effectiveStatus !== undefined && isNowDone) {
      if (completionDateExplicitlyCleared) {
        // Prevent clearing completionDate while setting status to DONE - this creates inconsistent state
        throw new Error('Cannot clear completionDate while setting status to DONE. Either keep the completion date or change status first.');
      } else if (completionDateSetToValue) {
        // User explicitly set a completion date - use that value (type-safe check)
        // Handle both Date objects and date strings (from JSON)
        if (dto.completionDate instanceof Date) {
          completionDate = dto.completionDate;
        } else if (typeof dto.completionDate === 'string') {
          completionDate = new Date(dto.completionDate);
        } else {
          throw new Error('Invalid completionDate value');
        }
      } else if (!completionDateProvided) {
        // User didn't provide completionDate - default to current date
        completionDate = new Date();
      }
    } else if (effectiveStatus !== undefined && !isNowDone && wasDone) {
      // Case 2: Status is changing from DONE to something else - clear completionDate
      completionDate = undefined;
    } else if (completionDateExplicitlyCleared) {
      // Case 3: User explicitly cleared completionDate (set to null) without changing status
      // Prevent clearing completionDate when task is already DONE (creates inconsistent state)
      if (task.status === EStatus.DONE) {
        throw new Error('Cannot clear completionDate while task status is DONE. Change status first.');
      }
      completionDate = undefined;
    } else if (completionDateSetToValue) {
      // Case 4: User explicitly set a completion date value (but status might not be done)
      // The auto-DONE logic above already handles this case, so this is a fallback
      // Handle both Date objects and date strings (from JSON)
      if (dto.completionDate instanceof Date) {
        completionDate = dto.completionDate;
      } else if (typeof dto.completionDate === 'string') {
        completionDate = new Date(dto.completionDate);
      } else {
        throw new Error('Invalid completionDate value');
      }
    } else if (!wasDone && isNowDone) {
      // Case 5: Status changed to DONE without explicit completionDate (defensive, covered by Case 1)
      completionDate = new Date();
    }
    // Case 6: If none of the above and user didn't provide completionDate, keep existing

    const updatedTask: ITaskEntity = {
      ...task,
      title: dto.title !== undefined ? dto.title.trim() : task.title,
      description: dto.description !== undefined ? dto.description?.trim() : task.description,
      status: effectiveStatus !== undefined ? effectiveStatus : task.status,
      priority: dto.priority !== undefined ? dto.priority : task.priority,
      startDate: dto.startDate !== undefined ? dto.startDate : task.startDate,
      dueDate: dto.dueDate !== undefined ? dto.dueDate : task.dueDate,
      completionDate,
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
      completionDate: new Date(),
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
