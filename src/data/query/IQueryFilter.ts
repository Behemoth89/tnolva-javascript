/**
 * Filter operators
 */
export type FilterOperator = 
  | 'eq'      // equals
  | 'neq'     // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'contains' // contains (for strings)
  | 'in';     // in array

/**
 * IQueryFilter Interface
 * Represents a single filter condition
 */
export interface IQueryFilter {
  /** Field name to filter on */
  field: string;
  /** Filter operator */
  operator: FilterOperator;
  /** Value to compare against */
  value: unknown;

  /**
   * Check if an entity matches this filter
   * @param entity - Entity to test
   * @returns True if entity matches filter
   */
  matches(entity: Record<string, unknown>): boolean;
}

/**
 * Create a new query filter
 * @param field - Field name
 * @param operator - Filter operator
 * @param value - Filter value
 * @returns Query filter instance
 */
export function createFilter(
  field: string, 
  operator: FilterOperator, 
  value: unknown
): IQueryFilter {
  return {
    field,
    operator,
    value,
    matches(entity: Record<string, unknown>): boolean {
    const fieldValue = entity[this.field];
    
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }
    
    switch (this.operator) {
      case 'eq':
        return fieldValue === this.value;
      case 'neq':
        return fieldValue !== this.value;
      case 'gt':
        return typeof fieldValue === 'number' && typeof this.value === 'number' && fieldValue > this.value;
      case 'gte':
        return typeof fieldValue === 'number' && typeof this.value === 'number' && fieldValue >= this.value;
      case 'lt':
        return typeof fieldValue === 'number' && typeof this.value === 'number' && fieldValue < this.value;
      case 'lte':
        return typeof fieldValue === 'number' && typeof this.value === 'number' && fieldValue <= this.value;
      case 'contains':
        if (typeof fieldValue === 'string' && typeof this.value === 'string') {
          return fieldValue.toLowerCase().includes(this.value.toLowerCase());
        }
        return false;
      case 'in':
        if (Array.isArray(this.value)) {
          return this.value.includes(fieldValue);
        }
        return false;
      default:
        return false;
    }
  }
  };
}
