import type { FilterOperator } from './IQueryFilter.js';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * IQueryBuilder Interface
 * Provides a fluent API for building complex queries
 */
export interface IQueryBuilder<T> {
  /**
   * Add an AND filter condition
   * @param field - Field name
   * @param operator - Filter operator
   * @param value - Filter value
   * @returns Query builder for chaining
   */
  where(field: string, operator: FilterOperator, value: unknown): IQueryBuilder<T>;

  /**
   * Add an OR filter condition
   * @param field - Field name
   * @param operator - Filter operator
   * @param value - Filter value
   * @returns Query builder for chaining
   */
  orWhere(field: string, operator: FilterOperator, value: unknown): IQueryBuilder<T>;

  /**
   * Apply pagination
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   * @returns Query builder for chaining
   */
  paginate(page: number, pageSize: number): IQueryBuilder<T>;

  /**
   * Apply sorting
   * @param field - Field to sort by
   * @param direction - Sort direction
   * @returns Query builder for chaining
   */
  orderBy(field: string, direction?: SortDirection): IQueryBuilder<T>;

  /**
   * Execute the query and return results
   * @returns Promise resolving to array of matching entities
   */
  executeAsync(): Promise<T[]>;

  /**
   * Get the total count of matching entities
   * @returns Promise resolving to count
   */
  countAsync(): Promise<number>;
}
