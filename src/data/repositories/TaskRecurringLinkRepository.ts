import type { ITaskRecurringLinkEntity, ITaskRecurringLinkRepository } from '../../interfaces/index.js';
import type { ILocalStorageAdapter } from '../adapters/ILocalStorageAdapter.js';
import { BaseRepository } from './BaseRepository.js';
import { STORAGE_KEY_TASK_RECURRING_LINKS } from '../storageKeys.js';

/**
 * TaskRecurringLinkRepository Class
 * Implements junction table operations for task-recurring relationships
 */
export class TaskRecurringLinkRepository extends BaseRepository<ITaskRecurringLinkEntity> implements ITaskRecurringLinkRepository {
  /**
   * Creates a new TaskRecurringLinkRepository instance
   * @param storage - Local storage adapter
   */
  constructor(storage: ILocalStorageAdapter) {
    super(storage, STORAGE_KEY_TASK_RECURRING_LINKS);
  }

  /**
   * Get entity ID
   */
  protected getEntityId(entity: ITaskRecurringLinkEntity): string {
    return entity.id;
  }

  /**
   * Set entity ID
   */
  protected setEntityId(entity: ITaskRecurringLinkEntity, id: string): void {
    entity.id = id;
  }

  /**
   * Get all links for a specific recurring task
   */
  getByRecurringTaskId(recurringTaskId: string): ITaskRecurringLinkEntity[] {
    const items = this.getAll();
    return items.filter((link) => link.recurringTaskId === recurringTaskId);
  }

  /**
   * Get all links for a specific recurring task asynchronously
   */
  async getByRecurringTaskIdAsync(recurringTaskId: string): Promise<ITaskRecurringLinkEntity[]> {
    const items = await this.getAllAsync();
    return items.filter((link) => link.recurringTaskId === recurringTaskId);
  }

  /**
   * Get all links for a specific task
   */
  getByTaskId(taskId: string): ITaskRecurringLinkEntity[] {
    const items = this.getAll();
    return items.filter((link) => link.taskId === taskId);
  }

  /**
   * Get all links for a specific task asynchronously
   */
  async getByTaskIdAsync(taskId: string): Promise<ITaskRecurringLinkEntity[]> {
    const items = await this.getAllAsync();
    return items.filter((link) => link.taskId === taskId);
  }

  /**
   * Get link by both IDs
   */
  getByBothIds(recurringTaskId: string, taskId: string): ITaskRecurringLinkEntity | null {
    const items = this.getAll();
    return items.find((link) => link.recurringTaskId === recurringTaskId && link.taskId === taskId) || null;
  }

  /**
   * Get link by both IDs asynchronously
   */
  async getByBothIdsAsync(recurringTaskId: string, taskId: string): Promise<ITaskRecurringLinkEntity | null> {
    const items = await this.getAllAsync();
    return items.find((link) => link.recurringTaskId === recurringTaskId && link.taskId === taskId) || null;
  }

  /**
   * Delete links by recurring task ID
   */
  async deleteByRecurringTaskIdAsync(recurringTaskId: string): Promise<number> {
    const items = await this.getAllAsync();
    const toKeep = items.filter((link) => link.recurringTaskId !== recurringTaskId);
    const deletedCount = items.length - toKeep.length;
    await this.storage.setItemAsync(this.storageKey, toKeep);
    return deletedCount;
  }

  /**
   * Delete links by task ID
   */
  async deleteByTaskIdAsync(taskId: string): Promise<number> {
    const items = await this.getAllAsync();
    const toKeep = items.filter((link) => link.taskId !== taskId);
    const deletedCount = items.length - toKeep.length;
    await this.storage.setItemAsync(this.storageKey, toKeep);
    return deletedCount;
  }
}
