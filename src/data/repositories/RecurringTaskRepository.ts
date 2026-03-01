import type { IRecurringTaskRepository } from '../../interfaces/IRecurringTaskRepository.js';
import type { IRecurringTask } from '../../interfaces/IRecurringTask.js';
import type { ILocalStorageAdapter } from '../adapters/ILocalStorageAdapter.js';
import { BaseRepository } from './BaseRepository.js';
import { STORAGE_KEY_RECURRING_TASKS } from '../storageKeys.js';
import { ERecurringTaskStatus } from '../../enums/ERecurringTaskStatus.js';

/**
 * RecurringTaskRepository Class
 * Implements IRecurringTaskRepository extending BaseRepository<IRecurringTask>
 */
export class RecurringTaskRepository extends BaseRepository<IRecurringTask> implements IRecurringTaskRepository {
  /**
   * Creates a new RecurringTaskRepository instance
   * @param storage - Local storage adapter
   */
  constructor(storage: ILocalStorageAdapter) {
    super(storage, STORAGE_KEY_RECURRING_TASKS);
  }

  /**
   * Get entity ID
   */
  protected getEntityId(entity: IRecurringTask): string {
    return entity.id;
  }

  /**
   * Set entity ID
   */
  protected setEntityId(entity: IRecurringTask, id: string): void {
    entity.id = id;
  }

  /**
   * Get all recurring tasks with a specific status
   */
  getByStatus(status: ERecurringTaskStatus): IRecurringTask[] {
    const items = this.getAll();
    return items.filter((task) => task.status === status);
  }

  /**
   * Get all recurring tasks with a specific status asynchronously
   */
  async getByStatusAsync(status: ERecurringTaskStatus): Promise<IRecurringTask[]> {
    const items = await this.getAllAsync();
    return items.filter((task) => task.status === status);
  }

  /**
   * Get all active recurring tasks
   */
  getActive(): IRecurringTask[] {
    return this.getByStatus(ERecurringTaskStatus.ACTIVE);
  }

  /**
   * Get all active recurring tasks asynchronously
   */
  async getActiveAsync(): Promise<IRecurringTask[]> {
    return this.getByStatusAsync(ERecurringTaskStatus.ACTIVE);
  }
}
