import type { ITaskRepository } from './ITaskRepository.js';

/**
 * IUnitOfWork Interface
 * Coordinates multiple repository operations within a single transaction scope
 */
export interface IUnitOfWork {
  /**
   * Get the Task repository
   */
  getTaskRepository(): ITaskRepository;

  /**
   * Register a new entity for insertion on commit
   * @param entity - Entity to register
   */
  registerNew(entity: unknown): void;

  /**
   * Register a modified entity for update on commit
   * @param entity - Entity to register
   */
  registerModified(entity: unknown): void;

  /**
   * Register a deleted entity for deletion on commit
   * @param entity - Entity to register
   */
  registerDeleted(entity: unknown): void;

  /**
   * Commit all registered changes to storage atomically
   */
  commit(): Promise<void>;

  /**
   * Discard all registered changes without modifying storage
   */
  rollback(): void;
}
