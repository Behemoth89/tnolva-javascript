import type { IStorageAdapter } from './IStorageAdapter.js';

/**
 * ILocalStorageAdapter Interface
 * Defines the contract for LocalStorage operations
 * Provides both sync and async methods for flexibility
 */
export interface ILocalStorageAdapter extends IStorageAdapter {
  /**
   * Get item from storage synchronously
   * @param key - Storage key (without namespace)
   * @returns Stored value or null
   */
  getItem<T>(key: string): T | null;

  /**
   * Set item in storage synchronously
   * @param key - Storage key (without namespace)
   * @param value - Value to store
   */
  setItem<T>(key: string, value: T): void;

  /**
   * Remove item from storage synchronously
   * @param key - Storage key (without namespace)
   */
  removeItem(key: string): void;

  /**
   * Get all keys from storage
   * @returns Array of all storage keys
   */
  getKeys(): string[];

  /**
   * Clear all items from storage
   */
  clear(): void;

  /**
   * Get item from storage asynchronously
   * @param key - Storage key (without namespace)
   * @returns Promise resolving to stored value or null
   */
  getItemAsync<T>(key: string): Promise<T | null>;

  /**
   * Set item in storage asynchronously
   * @param key - Storage key (without namespace)
   * @param value - Value to store
   * @returns Promise that resolves when operation completes
   */
  setItemAsync<T>(key: string, value: T): Promise<void>;

  /**
   * Remove item from storage asynchronously
   * @param key - Storage key (without namespace)
   * @returns Promise that resolves when operation completes
   */
  removeItemAsync(key: string): Promise<void>;

  /**
   * Get all keys from storage asynchronously
   * @returns Promise resolving to array of all storage keys
   */
  getKeysAsync(): Promise<string[]>;

  /**
   * Clear all items from storage asynchronously
   * @returns Promise that resolves when operation completes
   */
  clearAsync(): Promise<void>;
}
