import type { IStorageAdapter } from '../adapters/IStorageAdapter.js';
import type { IRepository } from '../../interfaces/IRepository.js';
import type { IQueryBuilder } from '../query/IQueryBuilder.js';
import { QueryBuilder } from '../query/QueryBuilder.js';

/**
 * BaseRepository<T> Abstract Class
 * Provides common CRUD logic for all entity types
 */
export abstract class BaseRepository<T> implements IRepository<T> {
  protected storage: IStorageAdapter;
  protected storageKey: string;

  /**
   * Creates a new BaseRepository instance
   * @param storage - Storage adapter
   * @param storageKey - Key for storing entities
   */
  constructor(storage: IStorageAdapter, storageKey: string) {
    this.storage = storage;
    this.storageKey = storageKey;
  }

  /**
   * Get all entities
   */
  getAll(): T[] {
    const data = this.storage.getItem<T[]>(this.storageKey);
    return data || [];
  }

  /**
   * Get entity by ID
   */
  getById(id: string): T | null {
    const items = this.getAll();
    return this.findById(items, id);
  }

  /**
   * Find entity by ID (internal helper)
   */
  protected findById(items: T[], id: string): T | null {
    const item = items.find((i) => this.getEntityId(i) === id);
    return item || null;
  }

  /**
   * Get entity ID (must be implemented by subclasses)
   */
  protected abstract getEntityId(entity: T): string;

  /**
   * Set entity ID (must be implemented by subclasses)
   */
  protected abstract setEntityId(entity: T, id: string): void;

  /**
   * Find entities matching filter criteria
   */
  find(filter: Record<string, unknown>): T[] {
    const items = this.getAll();
    return items.filter((item) => {
      const obj = item as unknown as Record<string, unknown>;
      return Object.entries(filter).every(([key, value]) => obj[key] === value);
    });
  }

  /**
   * Get a query builder for building complex queries
   */
  query(): IQueryBuilder<T> {
    return new QueryBuilder(() => this.getAll());
  }

  /**
   * Get all entities asynchronously
   */
  async getAllAsync(): Promise<T[]> {
    const data = await this.storage.getItemAsync<T[]>(this.storageKey);
    return data || [];
  }

  /**
   * Get entity by ID asynchronously
   */
  async getByIdAsync(id: string): Promise<T | null> {
    const items = await this.getAllAsync();
    return this.findById(items, id);
  }

  /**
   * Create a new entity
   */
  async createAsync(entity: T): Promise<T> {
    const items = await this.getAllAsync();
    const existingId = this.getEntityId(entity);
    const id = existingId || this.generateId();
    this.setEntityId(entity, id);
    items.push(entity);
    await this.storage.setItemAsync(this.storageKey, items);
    return entity;
  }

  /**
   * Update an existing entity
   */
  async updateAsync(id: string, updates: Partial<T>): Promise<T | null> {
    const items = await this.getAllAsync();
    const index = items.findIndex((item) => this.getEntityId(item) === id);
    
    if (index === -1) {
      return null;
    }

    const existing = items[index];
    const updated = { ...existing, ...updates } as T;
    items[index] = updated;
    await this.storage.setItemAsync(this.storageKey, items);
    return updated;
  }

  /**
   * Delete an entity
   */
  async deleteAsync(id: string): Promise<boolean> {
    const items = await this.getAllAsync();
    const index = items.findIndex((item) => this.getEntityId(item) === id);
    
    if (index === -1) {
      return false;
    }

    items.splice(index, 1);
    await this.storage.setItemAsync(this.storageKey, items);
    return true;
  }

  /**
   * Create multiple entities
   */
  async createBatchAsync(entities: T[]): Promise<T[]> {
    const items = await this.getAllAsync();
    const created: T[] = [];
    
    for (const entity of entities) {
      const existingId = this.getEntityId(entity);
      const id = existingId || this.generateId();
      this.setEntityId(entity, id);
      items.push(entity);
      created.push(entity);
    }
    
    await this.storage.setItemAsync(this.storageKey, items);
    return created;
  }

  /**
   * Delete multiple entities
   */
  async deleteBatchAsync(ids: string[]): Promise<number> {
    const items = await this.getAllAsync();
    const idSet = new Set(ids);
    const originalLength = items.length;
    
    const remaining = items.filter((item) => !idSet.has(this.getEntityId(item)));
    const deletedCount = originalLength - remaining.length;
    
    await this.storage.setItemAsync(this.storageKey, remaining);
    return deletedCount;
  }

  /**
   * Check if an entity exists
   */
  async existsAsync(id: string): Promise<boolean> {
    const items = await this.getAllAsync();
    return items.some((item) => this.getEntityId(item) === id);
  }

  /**
   * Generate a unique ID
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
