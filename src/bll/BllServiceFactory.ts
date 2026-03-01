import type { IBllServiceFactory } from './interfaces/IBllServiceFactory.js';
import type { ITaskService } from './interfaces/ITaskService.js';
import type { ICategoryService } from './interfaces/ICategoryService.js';
import type { IRecurrenceService } from './interfaces/IRecurrenceService.js';
import type { IUnitOfWork } from '../interfaces/IUnitOfWork.js';
import { TaskService } from './services/TaskService.js';
import { CategoryService } from './services/CategoryService.js';
import { RecurrenceService } from './services/RecurrenceService.js';

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
}

/**
 * Default factory instance
 */
export const bllServiceFactory = new BllServiceFactory();
