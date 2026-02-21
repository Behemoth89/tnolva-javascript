/**
 * IStorageAdapter Interface
 * Abstract async storage contract for future migration support
 * Enables swapping storage backends without changing repository code
 */
export interface IStorageAdapter {
  /**
   * Get item from storage
   * @param key - Storage key
   * @returns Stored value or null
   */
  getItem<T>(key: string): T | null;

  /**
   * Set item in storage
   * @param key - Storage key
   * @param value - Value to store
   */
  setItem<T>(key: string, value: T): void;

  /**
   * Remove item from storage
   * @param key - Storage key
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
   * @param key - Storage key
   * @returns Promise resolving to stored value or null
   */
  getItemAsync<T>(key: string): Promise<T | null>;

  /**
   * Set item in storage asynchronously
   * @param key - Storage key
   * @param value - Value to store
   * @returns Promise that resolves when operation completes
   */
  setItemAsync<T>(key: string, value: T): Promise<void>;

  /**
   * Remove item from storage asynchronously
   * @param key - Storage key
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
