import type { ITaskService } from './ITaskService.js';
import type { ICategoryService } from './ICategoryService.js';
import type { IRecurrenceService } from './IRecurrenceService.js';
import type { IRecurringTaskService } from './IRecurringTaskService.js';
import type { IStatisticsService } from './IStatisticsService.js';
import type { IUnitOfWork } from '../../interfaces/index.js';

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

  /**
   * Create a RecurringTaskService instance
   * @param unitOfWork - The UnitOfWork for data access
   * @returns A new RecurringTaskService instance
   */
  createRecurringTaskService(unitOfWork: IUnitOfWork): IRecurringTaskService;

  /**
   * Create a StatisticsService instance
   * @param unitOfWork - The UnitOfWork for data access
   * @returns A new StatisticsService instance
   */
  createStatisticsService(unitOfWork: IUnitOfWork): IStatisticsService;
}
