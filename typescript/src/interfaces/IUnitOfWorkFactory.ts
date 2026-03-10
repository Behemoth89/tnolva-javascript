import type { IUnitOfWork } from './IUnitOfWork.js';

/**
 * IUnitOfWorkFactory Interface
 * Creates UnitOfWork instances
 */
export interface IUnitOfWorkFactory {
  /**
   * Create a new UnitOfWork instance
   * @returns New UnitOfWork instance
   */
  create(): IUnitOfWork;
}
