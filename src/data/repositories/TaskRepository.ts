import type { Task } from '../../domain/Task.js';
import type { ITaskRepository } from '../../interfaces/ITaskRepository.js';
import type { ILocalStorageAdapter } from '../adapters/ILocalStorageAdapter.js';
import type { IQueryBuilder } from '../query/IQueryBuilder.js';
import { BaseRepository } from './BaseRepository.js';
import { QueryBuilder } from '../query/QueryBuilder.js';
import { STORAGE_KEY_TASKS } from '../storageKeys.js';
import type { EStatus } from '../../enums/EStatus.js';
import type { EPriority } from '../../enums/EPriority.js';

/**
 * TaskRepository Class
 * Implements ITaskRepository extending BaseRepository<Task>
 */
export class TaskRepository extends BaseRepository<Task> implements ITaskRepository {
  /**
   * Creates a new TaskRepository instance
   * @param storage - Local storage adapter
   */
  constructor(storage: ILocalStorageAdapter) {
    super(storage, STORAGE_KEY_TASKS);
  }

  /**
   * Get entity ID
   */
  protected getEntityId(entity: Task): string {
    return entity.id;
  }

  /**
   * Set entity ID
   */
  protected setEntityId(entity: Task, id: string): void {
    entity.id = id;
  }

  /**
   * Get all tasks with a specific status
   */
  getByStatus(status: EStatus): Task[] {
    const items = this.getAll();
    return items.filter((task) => task.status === status);
  }

  /**
   * Get all tasks with a specific priority
   */
  getByPriority(priority: EPriority): Task[] {
    const items = this.getAll();
    return items.filter((task) => task.priority === priority);
  }

  /**
   * Get all tasks with a specific status asynchronously
   */
  async getByStatusAsync(status: EStatus): Promise<Task[]> {
    const items = await this.getAllAsync();
    return items.filter((task) => task.status === status);
  }

  /**
   * Get all tasks with a specific priority asynchronously
   */
  async getByPriorityAsync(priority: EPriority): Promise<Task[]> {
    const items = await this.getAllAsync();
    return items.filter((task) => task.priority === priority);
  }

  /**
   * Get a query builder for building complex queries
   */
  query(): IQueryBuilder<Task> {
    return new QueryBuilder(() => this.getAll());
  }
}
