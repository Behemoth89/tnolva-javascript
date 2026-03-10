import type { IQueryBuilder, SortDirection, PaginationOptions } from './IQueryBuilder.js';
import type { IQueryFilter, FilterOperator } from './IQueryFilter.js';
import { createFilter } from './IQueryFilter.js';

/**
 * QueryBuilder Class
 * Implements IQueryBuilder for building complex queries
 */
export class QueryBuilder<T> implements IQueryBuilder<T> {
  private filters: IQueryFilter[] = [];
  private orFilters: IQueryFilter[] = [];
  private pagination: PaginationOptions | null = null;
  private sortField: string | null = null;
  private sortDirection: SortDirection = 'asc';
  private entityGetter: () => T[];

  /**
   * Creates a new QueryBuilder instance
   * @param entityGetter - Function to get all entities
   */
  constructor(entityGetter: () => T[]) {
    this.entityGetter = entityGetter;
  }

  /**
   * Add an AND filter condition
   */
  where(field: string, operator: FilterOperator, value: unknown): QueryBuilder<T> {
    this.filters.push(createFilter(field, operator, value));
    return this;
  }

  /**
   * Add an OR filter condition
   */
  orWhere(field: string, operator: FilterOperator, value: unknown): QueryBuilder<T> {
    this.orFilters.push(createFilter(field, operator, value));
    return this;
  }

  /**
   * Apply pagination
   */
  paginate(page: number, pageSize: number): QueryBuilder<T> {
    // Validate pagination parameters
    const validPage = Math.max(1, Math.floor(page));
    const validPageSize = Math.max(1, Math.floor(pageSize));
    this.pagination = { page: validPage, pageSize: validPageSize };
    return this;
  }

  /**
   * Apply sorting
   */
  orderBy(field: string, direction: SortDirection = 'asc'): QueryBuilder<T> {
    this.sortField = field;
    this.sortDirection = direction;
    return this;
  }

  /**
   * Execute the query and return results
   */
  async executeAsync(): Promise<T[]> {
    return new Promise((resolve) => {
      let results = this.entityGetter();

      // Build combined filter: (AND filters) OR (OR filters)
      const filteredResults: T[] = [];
      
      for (const item of results) {
        const itemObj = item as unknown as Record<string, unknown>;
        
        // Check if item matches all AND filters
        const matchesAndFilters = this.filters.length === 0 || 
          this.filters.every(filter => filter.matches(itemObj));
        
        // Check if item matches any OR filter
        const matchesOrFilters = this.orFilters.length > 0 &&
          this.orFilters.some(filter => filter.matches(itemObj));
        
        // Include if matches AND filters or matches OR filters
        if (matchesAndFilters || matchesOrFilters) {
          filteredResults.push(item);
        }
      }

      results = filteredResults;

      // Apply sorting
      if (this.sortField) {
        results = [...results].sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[this.sortField!];
          const bVal = (b as Record<string, unknown>)[this.sortField!];
          
          if (aVal === bVal) return 0;
          if (aVal === undefined || aVal === null) return 1;
          if (bVal === undefined || bVal === null) return -1;
          
          const comparison = aVal < bVal ? -1 : 1;
          return this.sortDirection === 'desc' ? -comparison : comparison;
        });
      }

      // Apply pagination
      if (this.pagination) {
        const start = (this.pagination.page - 1) * this.pagination.pageSize;
        const end = start + this.pagination.pageSize;
        results = results.slice(start, end);
      }

      resolve(results);
    });
  }

  /**
   * Get the total count of matching entities
   */
  async countAsync(): Promise<number> {
    return new Promise((resolve) => {
      let results = this.entityGetter();

      // Build combined filter: (AND filters) OR (OR filters)
      const filteredResults: T[] = [];
      
      for (const item of results) {
        const itemObj = item as unknown as Record<string, unknown>;
        
        // Check if item matches all AND filters
        const matchesAndFilters = this.filters.length === 0 || 
          this.filters.every(filter => filter.matches(itemObj));
        
        // Check if item matches any OR filter
        const matchesOrFilters = this.orFilters.length > 0 &&
          this.orFilters.some(filter => filter.matches(itemObj));
        
        // Include if matches AND filters or matches OR filters
        if (matchesAndFilters || matchesOrFilters) {
          filteredResults.push(item);
        }
      }

      resolve(filteredResults.length);
    });
  }
}
