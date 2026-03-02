import type { ITaskDependencyEntity, ITaskDependencyRepository } from '../../interfaces/index.js';
import type { ILocalStorageAdapter } from '../adapters/ILocalStorageAdapter.js';
import { BaseRepository } from './BaseRepository.js';
import { STORAGE_KEY_TASK_DEPENDENCIES } from '../storageKeys.js';

/**
 * TaskDependencyRepository Class
 * Implements junction table operations for task dependencies
 */
export class TaskDependencyRepository extends BaseRepository<ITaskDependencyEntity> implements ITaskDependencyRepository {
  /**
   * Creates a new TaskDependencyRepository instance
   * @param storage - Local storage adapter
   */
  constructor(storage: ILocalStorageAdapter) {
    super(storage, STORAGE_KEY_TASK_DEPENDENCIES);
  }

  /**
   * Get entity ID
   */
  protected getEntityId(entity: ITaskDependencyEntity): string {
    return entity.id;
  }

  /**
   * Set entity ID
   */
  protected setEntityId(entity: ITaskDependencyEntity, id: string): void {
    entity.id = id;
  }

  /**
   * Get all dependencies for a task (tasks this task depends on)
   */
  getDependenciesForTask(taskId: string): ITaskDependencyEntity[] {
    const items = this.getAll();
    return items.filter((dep) => dep.taskId === taskId);
  }

  /**
   * Get all dependencies for a task asynchronously
   */
  async getDependenciesForTaskAsync(taskId: string): Promise<ITaskDependencyEntity[]> {
    const items = await this.getAllAsync();
    return items.filter((dep) => dep.taskId === taskId);
  }

  /**
   * Get all dependents for a task (tasks that depend on this task)
   */
  getDependents(taskId: string): ITaskDependencyEntity[] {
    const items = this.getAll();
    return items.filter((dep) => dep.dependsOnTaskId === taskId);
  }

  /**
   * Get all dependents for a task asynchronously
   */
  async getDependentsAsync(taskId: string): Promise<ITaskDependencyEntity[]> {
    const items = await this.getAllAsync();
    return items.filter((dep) => dep.dependsOnTaskId === taskId);
  }

  /**
   * Check if a dependency exists between two tasks
   */
  hasDependency(taskId: string, dependsOnTaskId: string): boolean {
    const items = this.getAll();
    return items.some((dep) => dep.taskId === taskId && dep.dependsOnTaskId === dependsOnTaskId);
  }

  /**
   * Check if a dependency exists between two tasks asynchronously
   */
  async hasDependencyAsync(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    const items = await this.getAllAsync();
    return items.some((dep) => dep.taskId === taskId && dep.dependsOnTaskId === dependsOnTaskId);
  }

  /**
   * Delete all dependencies for a task (as task_id)
   */
  async deleteByTaskId(taskId: string): Promise<number> {
    const items = await this.getAllAsync();
    const toKeep = items.filter((dep) => dep.taskId !== taskId);
    const deletedCount = items.length - toKeep.length;
    await this.storage.setItemAsync(this.storageKey, toKeep);
    return deletedCount;
  }

  /**
   * Delete all dependencies where the task is the depended-on task (as depends_on_task_id)
   */
  async deleteByDependsOnTaskId(taskId: string): Promise<number> {
    const items = await this.getAllAsync();
    const toKeep = items.filter((dep) => dep.dependsOnTaskId !== taskId);
    const deletedCount = items.length - toKeep.length;
    await this.storage.setItemAsync(this.storageKey, toKeep);
    return deletedCount;
  }
}
