import type { IUnitOfWorkFactory } from '../../interfaces/IUnitOfWorkFactory.js';
import type { IUnitOfWork } from '../../interfaces/IUnitOfWork.js';
import type { ILocalStorageAdapter } from '../adapters/ILocalStorageAdapter.js';
import { UnitOfWork } from './UnitOfWork.js';

/**
 * UnitOfWorkFactory Class
 * Creates UnitOfWork instances
 */
export class UnitOfWorkFactory implements IUnitOfWorkFactory {
  private readonly storage: ILocalStorageAdapter;

  /**
   * Creates a new UnitOfWorkFactory instance
   * @param storage - Storage adapter
   */
  constructor(storage: ILocalStorageAdapter) {
    this.storage = storage;
  }

  /**
   * Create a new UnitOfWork instance
   */
  create(): IUnitOfWork {
    return new UnitOfWork(this.storage);
  }
}
