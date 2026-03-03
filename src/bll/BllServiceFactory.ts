import type { IBllServiceFactory } from './interfaces/IBllServiceFactory.js';
import type { ITaskService } from './interfaces/ITaskService.js';
import type { ICategoryService } from './interfaces/ICategoryService.js';
import type { IRecurrenceService } from './interfaces/IRecurrenceService.js';
import type { IRecurringTaskService } from './interfaces/IRecurringTaskService.js';
import type { IStatisticsService } from './interfaces/IStatisticsService.js';
import type { ITaskDependencyService } from './interfaces/ITaskDependencyService.js';
import type { IUnitOfWork } from '../interfaces/index.js';
import { TaskService } from './services/TaskService.js';
import { CategoryService } from './services/CategoryService.js';
import { RecurrenceService } from './services/RecurrenceService.js';
import { RecurringTaskService } from './services/RecurringTaskService.js';
import { StatisticsService } from './services/StatisticsService.js';
import { TaskDependencyService } from './services/TaskDependencyService.js';

/**
 * BllServiceFactory Class
 * Factory for creating BLL service instances
 */
export class BllServiceFactory implements IBllServiceFactory {
  /**
   * Create a TaskService instance
   * @param unitOfWork - The UnitOfWork for data access
   * @returns A new TaskService instance
   */
  createTaskService(unitOfWork: IUnitOfWork): ITaskService {
    return new TaskService(unitOfWork);
  }

  /**
   * Create a CategoryService instance
   * @param unitOfWork - The UnitOfWork for data access
   * @returns A new CategoryService instance
   */
  createCategoryService(unitOfWork: IUnitOfWork): ICategoryService {
    return new CategoryService(unitOfWork);
  }

  /**
   * Create a RecurrenceService instance
   * @param unitOfWork - The UnitOfWork for data access
   * @returns A new RecurrenceService instance
   */
  createRecurrenceService(unitOfWork: IUnitOfWork): IRecurrenceService {
    return new RecurrenceService(unitOfWork);
  }

  /**
   * Create a RecurringTaskService instance
   * @param unitOfWork - The UnitOfWork for data access
   * @returns A new RecurringTaskService instance
   */
  createRecurringTaskService(unitOfWork: IUnitOfWork): IRecurringTaskService {
    return new RecurringTaskService(unitOfWork);
  }

  /**
   * Create a StatisticsService instance
   * @param unitOfWork - The UnitOfWork for data access
   * @returns A new StatisticsService instance
   */
  createStatisticsService(unitOfWork: IUnitOfWork): IStatisticsService {
    return new StatisticsService(unitOfWork);
  }

  /**
   * Create a TaskDependencyService instance
   * @param unitOfWork - The UnitOfWork for data access
   * @returns A new TaskDependencyService instance
   */
  createTaskDependencyService(unitOfWork: IUnitOfWork): ITaskDependencyService {
    return new TaskDependencyService(unitOfWork);
  }
}

/**
 * Default factory instance
 */
export const bllServiceFactory = new BllServiceFactory();
