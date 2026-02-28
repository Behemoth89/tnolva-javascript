import type { IEntityId } from './IEntityId.js';
import type { IQueryBuilder } from '../data/query/IQueryBuilder.ts';

/**
 * IRepository<T> Interface
 * Generic interface for data access operations on any entity type
 * T is constrained to IEntityId to ensure all entities have an id property
 */
export interface IRepository<T extends IEntityId> {
  /**
   * Get all entities
   * @returns Array of all entities
   */
  getAll(): T[];

  /**
   * Get entity by ID
   * @param id - Entity identifier
   * @returns Entity or null if not found
   */
  getById(id: string): T | null;

  /**
   * Find entities matching filter criteria
   * @param filter - Query filter
   * @returns Array of matching entities
   */
  find(filter: Record<string, unknown>): T[];

  /**
   * Get a query builder for building complex queries
   * @returns Query builder instance
   */
  query(): IQueryBuilder<T>;

  /**
   * Get all entities asynchronously
   * @returns Promise resolving to array of all entities
   */
  getAllAsync(): Promise<T[]>;

  /**
   * Get entity by ID asynchronously
   * @param id - Entity identifier
   * @returns Promise resolving to entity or null
   */
  getByIdAsync(id: string): Promise<T | null>;

  /**
   * Create a new entity
   * @param entity - Entity to create
   * @returns Created entity with assigned ID
   */
  createAsync(entity: T): Promise<T>;

  /**
   * Update an existing entity
   * @param id - Entity identifier
   * @param updates - Partial entity with updates
   * @returns Updated entity
   */
  updateAsync(id: string, updates: Partial<T>): Promise<T | null>;

  /**
   * Delete an entity
   * @param id - Entity identifier
   * @returns True if deleted, false if not found
   */
  deleteAsync(id: string): Promise<boolean>;

  /**
   * Create multiple entities
   * @param entities - Array of entities to create
   * @returns Array of created entities with assigned IDs
   */
  createBatchAsync(entities: T[]): Promise<T[]>;

  /**
   * Delete multiple entities
   * @param ids - Array of entity identifiers
   * @returns Number of deleted entities
   */
  deleteBatchAsync(ids: string[]): Promise<number>;

  /**
   * Check if an entity exists
   * @param id - Entity identifier
   * @returns True if exists, false otherwise
   */
  existsAsync(id: string): Promise<boolean>;
}
