import { describe, it, expect, beforeEach } from 'vitest';
import { QueryBuilder } from '../data/query/QueryBuilder.js';

interface TestEntity {
  id: string;
  name: string;
  age: number;
  status: string;
}

describe('QueryBuilder', () => {
  let entities: TestEntity[];

  beforeEach(() => {
    entities = [
      { id: '1', name: 'Alice', age: 25, status: 'active' },
      { id: '2', name: 'Bob', age: 30, status: 'active' },
      { id: '3', name: 'Charlie', age: 35, status: 'inactive' },
      { id: '4', name: 'Diana', age: 25, status: 'active' },
    ];
  });

  describe('where', () => {
    it('should filter by equality', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder.where('status', 'eq', 'active').executeAsync();

      expect(result).toHaveLength(3);
    });

    it('should filter by not equal', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder.where('status', 'neq', 'active').executeAsync();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Charlie');
    });

    it('should filter by greater than', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder.where('age', 'gt', 30).executeAsync();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Charlie');
    });

    it('should filter by less than', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder.where('age', 'lt', 30).executeAsync();

      expect(result).toHaveLength(2);
    });

    it('should filter by contains (case-insensitive)', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder.where('name', 'contains', 'li').executeAsync();

      // 'li' is in Alice and Charlie
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
    });
  });

  describe('orWhere', () => {
    it('should combine filters with OR logic', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder
        .where('age', 'eq', 25)
        .orWhere('age', 'eq', 35)
        .executeAsync();

      // age 25: Alice, Diana; age 35: Charlie
      expect(result).toHaveLength(3);
    });
  });

  describe('orderBy', () => {
    it('should sort ascending by default', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder.orderBy('name').executeAsync();

      expect(result[0].name).toBe('Alice');
      expect(result[3].name).toBe('Diana');
    });

    it('should sort descending', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder.orderBy('name', 'desc').executeAsync();

      expect(result[0].name).toBe('Diana');
      expect(result[3].name).toBe('Alice');
    });
  });

  describe('paginate', () => {
    it('should paginate results', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder.paginate(2, 2).executeAsync();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Diana');
    });

    it('should handle page out of bounds', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder.paginate(5, 10).executeAsync();

      expect(result).toHaveLength(0);
    });

    it('should handle invalid page values (negative/zero)', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder.paginate(-1, 2).executeAsync();

      // Invalid pages should be normalized to page 1
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
    });

    it('should handle invalid pageSize values', async () => {
      const builder = new QueryBuilder(() => entities);
      const result = await builder.paginate(1, -5).executeAsync();

      // Invalid pageSize should be normalized to 1
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });
  });

  describe('countAsync', () => {
    it('should return total count of matching entities', async () => {
      const builder = new QueryBuilder(() => entities);
      const count = await builder.where('status', 'eq', 'active').countAsync();

      expect(count).toBe(3);
    });

    it('should return count with OR filters', async () => {
      const builder = new QueryBuilder(() => entities);
      const count = await builder
        .where('age', 'eq', 25)
        .orWhere('age', 'eq', 35)
        .countAsync();

      // age 25: Alice, Diana; age 35: Charlie
      expect(count).toBe(3);
    });

    it('should return 0 when no matches', async () => {
      const builder = new QueryBuilder(() => entities);
      const count = await builder.where('status', 'eq', 'nonexistent').countAsync();

      expect(count).toBe(0);
    });

    it('should return total count without filters', async () => {
      const builder = new QueryBuilder(() => entities);
      const count = await builder.countAsync();

      expect(count).toBe(4);
    });
  });

  describe('chaining', () => {
    it('should support method chaining', async () => {
      const result = await new QueryBuilder(() => entities)
        .where('status', 'eq', 'active')
        .where('age', 'gte', 25)
        .orderBy('name')
        .paginate(1, 2)
        .executeAsync();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
    });
  });
});
