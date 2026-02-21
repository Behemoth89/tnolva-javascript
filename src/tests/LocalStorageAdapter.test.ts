import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageAdapter } from '../data/adapters/LocalStorageAdapter.js';

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    adapter = new LocalStorageAdapter('test_');
  });

  describe('sync operations', () => {
    it('should set and get an item', () => {
      adapter.setItem('key1', { name: 'test' });
      const result = adapter.getItem<{ name: string }>('key1');
      expect(result).toEqual({ name: 'test' });
    });

    it('should return null for non-existent key', () => {
      const result = adapter.getItem('nonexistent');
      expect(result).toBeNull();
    });

    it('should remove an item', () => {
      adapter.setItem('key1', 'value');
      adapter.removeItem('key1');
      const result = adapter.getItem('key1');
      expect(result).toBeNull();
    });

    it('should get all keys with namespace', () => {
      adapter.setItem('key1', 'value1');
      adapter.setItem('key2', 'value2');
      const keys = adapter.getKeys();
      expect(keys).toContain('test_key1');
      expect(keys).toContain('test_key2');
    });

    it('should clear all namespaced items', () => {
      adapter.setItem('key1', 'value1');
      adapter.setItem('key2', 'value2');
      adapter.clear();
      expect(adapter.getKeys()).toHaveLength(0);
    });
  });

  describe('async operations', () => {
    it('should get item async', async () => {
      adapter.setItem('key1', 'value1');
      const result = await adapter.getItemAsync<string>('key1');
      expect(result).toBe('value1');
    });

    it('should set item async', async () => {
      await adapter.setItemAsync('key1', 'value1');
      const result = adapter.getItem<string>('key1');
      expect(result).toBe('value1');
    });

    it('should remove item async', async () => {
      adapter.setItem('key1', 'value1');
      await adapter.removeItemAsync('key1');
      const result = adapter.getItem('key1');
      expect(result).toBeNull();
    });

    it('should get keys async', async () => {
      adapter.setItem('key1', 'value1');
      adapter.setItem('key2', 'value2');
      const keys = await adapter.getKeysAsync();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should clear async', async () => {
      adapter.setItem('key1', 'value1');
      await adapter.clearAsync();
      const keys = await adapter.getKeysAsync();
      expect(keys).toHaveLength(0);
    });
  });

  describe('namespacing', () => {
    it('should use custom namespace', () => {
      const customAdapter = new LocalStorageAdapter('custom_');
      customAdapter.setItem('key1', 'value1');
      const result = localStorage.getItem('custom_key1');
      expect(result).toBe('value1');
    });
  });
});
