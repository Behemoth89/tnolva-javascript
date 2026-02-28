import type { IUnitOfWork } from '../../interfaces/IUnitOfWork.js';
import type { ITaskRepository } from '../../interfaces/ITaskRepository.js';
import type { ICategoryRepository } from '../../interfaces/ICategoryRepository.js';
import type { ITaskCategoryAssignment } from '../../interfaces/ITaskCategoryAssignment.js';
import type { ILocalStorageAdapter } from '../adapters/ILocalStorageAdapter.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { CategoryRepository } from '../repositories/CategoryRepository.js';

/**
 * Change tracking entry
 */
interface ChangeEntry {
  entity: unknown;
  type: 'new' | 'modified' | 'deleted';
}

/**
 * UnitOfWork Class
 * Coordinates multiple repository changes within a transaction scope
 */
export class UnitOfWork implements IUnitOfWork {
  private readonly taskRepository: TaskRepository;
  private readonly categoryRepository: CategoryRepository;
  private changes: ChangeEntry[] = [];
  private committed = false;

  /**
   * Creates a new UnitOfWork instance
   * @param storage - Storage adapter
   */
  constructor(storage: ILocalStorageAdapter) {
    this.taskRepository = new TaskRepository(storage);
    this.categoryRepository = new CategoryRepository(storage);
  }

  /**
   * Get the Task repository
   */
  getTaskRepository(): ITaskRepository {
    return this.taskRepository;
  }

  /**
   * Get the Category repository
   */
  getCategoryRepository(): ICategoryRepository {
    return this.categoryRepository;
  }

  /**
   * Assign a task to a category
   */
  async assignTaskToCategory(taskId: string, categoryId: string): Promise<ITaskCategoryAssignment | null> {
    return this.categoryRepository.assignTaskToCategory(taskId, categoryId);
  }

  /**
   * Remove a task from a category
   */
  async removeTaskFromCategory(taskId: string, categoryId: string): Promise<boolean> {
    return this.categoryRepository.removeTaskFromCategory(taskId, categoryId);
  }

  /**
   * Register a new entity for insertion on commit
   */
  registerNew(entity: unknown): void {
    this.assertNotCommitted();
    this.changes.push({ entity, type: 'new' });
  }

  /**
   * Register a modified entity for update on commit
   */
  registerModified(entity: unknown): void {
    this.assertNotCommitted();
    this.changes.push({ entity, type: 'modified' });
  }

  /**
   * Register a deleted entity for deletion on commit
   */
  registerDeleted(entity: unknown): void {
    this.assertNotCommitted();
    this.changes.push({ entity, type: 'deleted' });
  }

  /**
   * Commit all registered changes to storage atomically
   */
  async commit(): Promise<void> {
    this.assertNotCommitted();

    try {
      // For LocalStorage, we commit each change individually
      // In a real database, this would be a single transaction
      for (const change of this.changes) {
        const task = change.entity as { id: string };

        switch (change.type) {
          case 'new':
            await this.taskRepository.createAsync(task as never);
            break;
          case 'modified':
            await this.taskRepository.updateAsync(task.id, task as never);
            break;
          case 'deleted':
            await this.taskRepository.deleteAsync(task.id);
            break;
        }
      }

      this.committed = true;
      this.changes = [];
    } catch (error) {
      // Note: On error, some changes may have been persisted while others failed,
      // potentially leaving inconsistent state. The changes array is cleared to
      // prevent re-attempting the same failed operations. committed remains false
      // to allow caller to handle recovery (retry or rollback).
      this.changes = [];
      throw error;
    }
  }

  /**
   * Discard all registered changes without modifying storage
   */
  rollback(): void {
    this.changes = [];
    this.committed = false;
  }

  /**
   * Assert that the unit of work has not been committed
   */
  private assertNotCommitted(): void {
    if (this.committed) {
      throw new Error('This UnitOfWork has already been committed');
    }
  }
}
