import type { ITaskService } from './ITaskService.js';
import type { ICategoryService } from './ICategoryService.js';
import type { IRecurrenceService } from './IRecurrenceService.js';
import type { IUnitOfWork } from '../../interfaces/IUnitOfWork.js';

/**
 * IBllServiceFactory Interface
 * Defines the contract for creating BLL service instances
 */
export interface IBllServiceFactory {
  /**
   * Create a TaskService instance
   * @param unitOfWork - The UnitOfWork for data access
   * @returns A new TaskService instance
   */
  createTaskService(unitOfWork: IUnitOfWork): ITaskService;

  /**
   * Create a CategoryService instance
   * @param unitOfWork - The UnitOfWork for data access
   * @returns A new CategoryService instance
   */
  createCategoryService(unitOfWork: IUnitOfWork): ICategoryService;

  /**
   * Create a RecurrenceService instance
   * @param unitOfWork - The UnitOfWork for data access
   * @returns A new RecurrenceService instance
   */
  createRecurrenceService(unitOfWork: IUnitOfWork): IRecurrenceService;
}
