/**
 * UI Bridge Service
 * Connects UI components to BLL services
 */

import { BllServiceFactory } from '../../bll/BllServiceFactory.js';
import { unitOfWorkFactory } from '../../data/unit-of-work/UnitOfWorkFactory.js';
import type { IInterval } from '../../interfaces/index.js';
import type { ITaskCategoryCreateDto, ITaskCategoryUpdateDto } from '../../interfaces/index.js';
import type { IRecurrenceTemplateEntity } from '../../interfaces/index.js';
import type { IRecurringTaskEntity, IRecurringTaskCreateDto, IRecurringTaskUpdateDto } from '../../interfaces/index.js';
import { EStatus, EPriority, ERecurringTaskStatus, EDependencyType } from '../../enums/index.js';
import { generateGuid } from '../../utils/guid.js';
import type { IBllTaskCreateDto, IBllTaskUpdateDto, IBllCategoryDto, IBllTaskDto } from '../../bll/interfaces/dtos/index.js';

// Create factory instance
const bllFactory = new BllServiceFactory();

/**
 * UI Bridge - connects UI to BLL services
 * Creates fresh UnitOfWork for each operation to avoid committed state issues
 */
export class UiBridge {
  /**
   * Get a fresh UnitOfWork instance for each operation
   * This prevents "already committed" errors from reused UnitOfWork
   */
  private createUnitOfWork() {
    return unitOfWorkFactory.create();
  }

  // Helper to get task service with fresh UnitOfWork
  private getTaskService() {
    return bllFactory.createTaskService(this.createUnitOfWork());
  }

  // Helper to get category service with fresh UnitOfWork
  private getCategoryService() {
    return bllFactory.createCategoryService(this.createUnitOfWork());
  }

  // Helper to get recurrence service with fresh UnitOfWork
  private getRecurrenceService() {
    return bllFactory.createRecurrenceService(this.createUnitOfWork());
  }

  // Helper to get recurring task service with fresh UnitOfWork
  private getRecurringTaskService() {
    return bllFactory.createRecurringTaskService(this.createUnitOfWork());
  }
    
  // ==================== Task Operations ====================
  
  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<IBllTaskDto[]> {
    return this.getTaskService().getAllAsync();
  }
  
  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<IBllTaskDto | null> {
    return this.getTaskService().getByIdAsync(id);
  }
  
  /**
   * Create a new task
   */
  async createTask(data: {
    title: string;
    description?: string;
    status?: EStatus;
    priority?: EPriority;
    startDate?: Date;
    dueDate?: Date;
    tags?: string[];
    categoryId?: string;
    parentTaskId?: string;
  }): Promise<IBllTaskDto> {
    const dto: IBllTaskCreateDto = {
      id: generateGuid(),
      title: data.title,
      description: data.description,
      status: data.status || EStatus.TODO,
      priority: data.priority || EPriority.MEDIUM,
      startDate: data.startDate,
      dueDate: data.dueDate,
      tags: data.tags,
      categoryId: data.categoryId,
    };
    const task = await this.getTaskService().createAsync(dto);
    
    // If parentTaskId is provided, create dependency
    if (data.parentTaskId) {
      const dependencyService = bllFactory.createTaskDependencyService(this.createUnitOfWork());
      await dependencyService.addSubtaskAsync(task.id, data.parentTaskId);
    }
    
    return task;
  }
  
  /**
   * Update a task
   */
  async updateTask(id: string, data: {
    title?: string;
    description?: string;
    status?: EStatus;
    priority?: EPriority;
    startDate?: Date;
    dueDate?: Date;
    completionDate?: Date | null;
    tags?: string[];
    categoryId?: string | null;
  }): Promise<IBllTaskDto | null> {
    const dto: IBllTaskUpdateDto = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate,
      dueDate: data.dueDate,
      completionDate: data.completionDate,
      tags: data.tags,
      categoryId: data.categoryId,
    };
    return this.getTaskService().updateAsync(id, dto);
  }
  
  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<boolean> {
    return this.getTaskService().deleteAsync(id);
  }
  
  // ==================== Category Operations ====================
  
  /**
   * Get all categories
   */
  async getAllCategories(): Promise<IBllCategoryDto[]> {
    return this.getCategoryService().getAllAsync();
  }
  
  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<IBllCategoryDto | null> {
    return this.getCategoryService().getByIdAsync(id);
  }
  
  /**
   * Create a new category
   */
  async createCategory(data: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<IBllCategoryDto> {
    const dto: ITaskCategoryCreateDto = {
      id: generateGuid(),
      name: data.name,
      description: data.description,
      color: data.color,
    };
    return this.getCategoryService().createAsync(dto);
  }
  
  /**
   * Update a category
   */
  async updateCategory(id: string, data: {
    name?: string;
    description?: string;
    color?: string;
  }): Promise<IBllCategoryDto | null> {
    const dto: ITaskCategoryUpdateDto = {
      name: data.name,
      description: data.description,
      color: data.color,
    };
    return this.getCategoryService().updateAsync(id, dto);
  }
  
  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<boolean> {
    return this.getCategoryService().deleteAsync(id);
  }
  
  // ==================== Recurrence Template Operations ====================
  
  /**
   * Get all recurrence templates
   */
  async getAllTemplates(): Promise<IRecurrenceTemplateEntity[]> {
    const service = this.getRecurrenceService();
    await service.initializeAsync();
    return service.getAllTemplatesAsync();
  }
  
  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<IRecurrenceTemplateEntity | null> {
    return this.getRecurrenceService().getTemplateByIdAsync(id);
  }
  
  // Note: RecurrenceService doesn't have create/update/delete for templates in the current interface
  
  // ==================== Recurring Task Operations ====================
  
  /**
   * Get all recurring tasks
   */
  async getAllRecurringTasks(): Promise<IRecurringTaskEntity[]> {
    return this.getRecurringTaskService().getAllAsync();
  }
  
  /**
   * Get recurring task by ID
   */
  async getRecurringTaskById(id: string): Promise<IRecurringTaskEntity | null> {
    return this.getRecurringTaskService().getByIdAsync(id);
  }
  
  /**
   * Create a new recurring task
   */
  async createRecurringTask(data: {
    title: string;
    description?: string;
    priority?: EPriority;
    startDate: Date;
    endDate?: Date;
    intervals: { value: number; unit: string }[];
    tags?: string[];
    categoryIds?: string[];
    recurrenceTemplateId: string;
  }): Promise<IRecurringTaskEntity> {
    const dto: IRecurringTaskCreateDto = {
      title: data.title,
      description: data.description,
      priority: data.priority || EPriority.MEDIUM,
      startDate: data.startDate,
      endDate: data.endDate,
      intervals: data.intervals as IInterval[],
      tags: data.tags,
      categoryIds: data.categoryIds,
      recurrenceTemplateId: data.recurrenceTemplateId,
    };
    return this.getRecurringTaskService().createAsync(dto);
  }
  
  /**
   * Update a recurring task
   */
  async updateRecurringTask(id: string, data: {
    title?: string;
    description?: string;
    priority?: EPriority;
    startDate?: Date;
    endDate?: Date;
    intervals?: { value: number; unit: string }[];
    tags?: string[];
    categoryIds?: string[];
  }): Promise<IRecurringTaskEntity | null> {
    const dto: IRecurringTaskUpdateDto = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      startDate: data.startDate,
      endDate: data.endDate,
      intervals: data.intervals as IInterval[],
      tags: data.tags,
      categoryIds: data.categoryIds,
    };
    return this.getRecurringTaskService().updateAsync(id, dto);
  }
  
  /**
   * Delete a recurring task
   */
  async deleteRecurringTask(id: string): Promise<boolean> {
    return this.getRecurringTaskService().deleteAsync(id);
  }
  
  /**
   * Stop a recurring task
   */
  async stopRecurringTask(id: string): Promise<IRecurringTaskEntity | null> {
    return this.getRecurringTaskService().stopAsync(id);
  }
  
  /**
   * Reactivate a recurring task
   */
  async reactivateRecurringTask(id: string): Promise<IRecurringTaskEntity | null> {
    return this.getRecurringTaskService().reactivateAsync(id);
  }
  
  // ==================== Dependency Operations ====================
  
  /**
   * Get all tasks (for dependency selection)
   */
  async getAllTasksForDependency(): Promise<IBllTaskDto[]> {
    return this.getTaskService().getAllAsync();
  }
  
  /**
   * Add a subtask dependency
   */
  async addSubtask(subtaskId: string, parentTaskId: string): Promise<void> {
    const dependencyService = bllFactory.createTaskDependencyService(this.createUnitOfWork());
    await dependencyService.addSubtaskAsync(subtaskId, parentTaskId);
  }
  
  /**
   * Remove a subtask dependency
   */
  async removeSubtask(subtaskId: string, parentTaskId: string): Promise<boolean> {
    const dependencyService = bllFactory.createTaskDependencyService(this.createUnitOfWork());
    return dependencyService.removeSubtaskAsync(subtaskId, parentTaskId);
  }
  
  /**
   * Get all dependencies
   */
  async getAllDependencies(): Promise<{ taskId: string; dependsOnTaskId: string; dependencyType: EDependencyType }[]> {
    const unitOfWork = this.createUnitOfWork();
    const dependencyRepo = unitOfWork.getTaskDependencyRepository();
    const dependencies = await dependencyRepo.getAllAsync();
    return dependencies.map(dep => ({
      taskId: dep.taskId,
      dependsOnTaskId: dep.dependsOnTaskId,
      dependencyType: dep.dependencyType,
    }));
  }
  
  /**
   * Get all subtasks for a task
   */
  async getSubtasks(taskId: string): Promise<IBllTaskDto[]> {
    const dependencyService = bllFactory.createTaskDependencyService(this.createUnitOfWork());
    return dependencyService.getSubtasksAsync(taskId);
  }

  /**
   * Get parent task for a subtask
   */
  async getParentTask(subtaskId: string): Promise<IBllTaskDto | null> {
    const dependencyService = bllFactory.createTaskDependencyService(this.createUnitOfWork());
    return dependencyService.getParentTaskAsync(subtaskId);
  }
}

export { EStatus, EPriority, ERecurringTaskStatus, EDependencyType };
