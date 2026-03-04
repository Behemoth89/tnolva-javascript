/**
 * Sorting Utility
 * Provides reusable sorting functionality for tables
 */

/**
 * Sort direction - using const object instead of enum for erasableSyntaxOnly compatibility
 */
export const ESortDirection = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type ESortDirection = typeof ESortDirection[keyof typeof ESortDirection];

/**
 * Sort configuration for a column
 */
export interface ISortConfig<T> {
  key: keyof T;
  direction: ESortDirection;
}

/**
 * Column definition for sortable tables
 */
export interface ISortableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
}

/**
 * Sortable table state manager
 * Generic class that manages sorting state for any data type
 */
export class TableSorter<T> {
  private currentSort: ISortConfig<T> | null = null;
  private data: T[];

  constructor(data: T[]) {
    this.data = data;
  }

  /**
   * Sort data by key, toggling direction between ASC and DESC
   * @param key - The property key to sort by
   * @returns New sorted array (does not modify original)
   */
  sort(key: keyof T): T[] {
    const direction = this.currentSort?.key === key
      ? (this.currentSort.direction === ESortDirection.ASC
          ? ESortDirection.DESC
          : ESortDirection.ASC)
      : ESortDirection.ASC;

    this.currentSort = { key, direction };

    const sorted = [...this.data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;

      // Handle different data types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else if (aVal instanceof Date && typeof bVal === 'string') {
        comparison = aVal.getTime() - new Date(bVal).getTime();
      } else if (typeof aVal === 'string' && bVal instanceof Date) {
        comparison = new Date(aVal).getTime() - bVal.getTime();
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        // Fallback: convert to strings and compare
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return direction === ESortDirection.DESC ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Get current sort state
   */
  getSortState(): ISortConfig<T> | null {
    return this.currentSort;
  }

  /**
   * Check if a column is currently sorted
   */
  isSorted(key: keyof T): boolean {
    return this.currentSort?.key === key;
  }

  /**
   * Get sort direction for a column
   */
  getSortDirection(key: keyof T): ESortDirection | null {
    if (this.currentSort?.key === key) {
      return this.currentSort.direction;
    }
    return null;
  }

  /**
   * Update source data (useful when data changes)
   */
  updateData(newData: T[]): void {
    this.data = newData;
  }

  /**
   * Reset sort state
   */
  reset(): void {
    this.currentSort = null;
  }

  /**
   * Get current data without sorting
   */
  getData(): T[] {
    return this.data;
  }
}

/**
 * Generate HTML for a sortable table header
 * @param column - Column configuration
 * @param sortState - Current sort state
 * @param handlerName - Name of the global click handler function
 * @returns HTML string for the th element
 */
export function getSortHeaderHtml<T>(
  column: ISortableColumn<T>,
  sortState: ISortConfig<T> | null,
  handlerName: string
): string {
  const isSorted = sortState?.key === column.key;
  const direction = isSorted ? sortState.direction : null;

  // Sort indicator icons
  const sortIcon = direction === ESortDirection.ASC
    ? '&#9650;'  // Up triangle
    : direction === ESortDirection.DESC
      ? '&#9660;'  // Down triangle
      : '';

  // Only make sortable if not explicitly disabled
  const isSortable = column.sortable !== false;

  if (!isSortable) {
    return `<th>${column.label}</th>`;
  }

  return `
    <th class="sortable-header ${isSorted ? 'sorted' : ''}" 
        data-sort-key="${String(column.key)}" 
        onclick="${handlerName}('${String(column.key)}')">
      <span class="sort-header-content">
        ${column.label}
        ${isSorted ? `<span class="sort-indicator">${sortIcon}</span>` : ''}
      </span>
    </th>
  `;
}

/**
 * Sort utility helpers for common operations
 */
export const SortUtils = {
  /**
   * Compare strings (case-insensitive)
   */
  compareString: (a: string, b: string, direction: ESortDirection): number => {
    const result = a.localeCompare(b);
    return direction === ESortDirection.ASC ? result : -result;
  },

  /**
   * Compare dates
   */
  compareDate: (a: Date | string, b: Date | string, direction: ESortDirection): number => {
    const dateA = a instanceof Date ? a.getTime() : new Date(a).getTime();
    const dateB = b instanceof Date ? b.getTime() : new Date(b).getTime();
    const result = dateA - dateB;
    return direction === ESortDirection.ASC ? result : -result;
  },

  /**
   * Compare numbers
   */
  compareNumber: (a: number, b: number, direction: ESortDirection): number => {
    const result = a - b;
    return direction === ESortDirection.ASC ? result : -result;
  },

  /**
   * Compare enums by their string values
   */
  compareEnum: (a: string, b: string, direction: ESortDirection): number => {
    const result = a.localeCompare(b);
    return direction === ESortDirection.ASC ? result : -result;
  },
};
