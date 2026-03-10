import type { ILocalStorageAdapter } from './ILocalStorageAdapter.js';
import { STORAGE_NAMESPACE } from '../storageKeys.js';

/**
 * LocalStorageAdapter Class
 * Implements ILocalStorageAdapter wrapping browser localStorage
 * Provides both sync and async APIs for flexibility
 */
export class LocalStorageAdapter implements ILocalStorageAdapter {
  private readonly namespace: string;

  /**
   * Creates a new LocalStorageAdapter instance
   * @param customNamespace - Optional custom namespace (defaults to 'tnolva_')
   */
  constructor(customNamespace: string = STORAGE_NAMESPACE) {
    this.namespace = customNamespace;
  }

  /**
   * Get the namespaced key
   * @param key - Original key
   * @returns Namespaced key
   */
  private getNamespacedKey(key: string): string {
    return `${this.namespace}${key}`;
  }

  /**
   * Get item from storage synchronously
   * @param key - Storage key (without namespace)
   * @returns Stored value or null
   */
  getItem<T>(key: string): T | null {
    const namespacedKey = this.getNamespacedKey(key);
    const item = localStorage.getItem(namespacedKey);
    if (item === null) {
      return null;
    }
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  }

  /**
   * Set item in storage synchronously
   * @param key - Storage key (without namespace)
   * @param value - Value to store
   */
  setItem<T>(key: string, value: T): void {
    const namespacedKey = this.getNamespacedKey(key);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(namespacedKey, serialized);
  }

  /**
   * Remove item from storage synchronously
   * @param key - Storage key (without namespace)
   */
  removeItem(key: string): void {
    const namespacedKey = this.getNamespacedKey(key);
    localStorage.removeItem(namespacedKey);
  }

  /**
   * Get all namespaced keys from storage
   * @returns Array of storage keys
   */
  getKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.namespace)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Clear all items with the namespace prefix
   */
  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.namespace)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Get item from storage asynchronously
   * @param key - Storage key (without namespace)
   * @returns Promise resolving to stored value or null
   */
  async getItemAsync<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      // LocalStorage is synchronous, but we wrap in Promise for future async backend support
      const result = this.getItem<T>(key);
      resolve(result);
    });
  }

  /**
   * Set item in storage asynchronously
   * @param key - Storage key (without namespace)
   * @param value - Value to store
   * @returns Promise that resolves when operation completes
   */
  async setItemAsync<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
      this.setItem(key, value);
      resolve();
    });
  }

  /**
   * Remove item from storage asynchronously
   * @param key - Storage key (without namespace)
   * @returns Promise that resolves when operation completes
   */
  async removeItemAsync(key: string): Promise<void> {
    return new Promise((resolve) => {
      this.removeItem(key);
      resolve();
    });
  }

  /**
   * Get all keys from storage asynchronously
   * @returns Promise resolving to array of all storage keys
   */
  async getKeysAsync(): Promise<string[]> {
    return new Promise((resolve) => {
      const keys = this.getKeys();
      // Remove namespace prefix from keys
      const unprefixedKeys = keys.map((key) => key.replace(this.namespace, ''));
      resolve(unprefixedKeys);
    });
  }

  /**
   * Clear all items from storage asynchronously
   * @returns Promise that resolves when operation completes
   */
  async clearAsync(): Promise<void> {
    return new Promise((resolve) => {
      this.clear();
      resolve();
    });
  }
}
