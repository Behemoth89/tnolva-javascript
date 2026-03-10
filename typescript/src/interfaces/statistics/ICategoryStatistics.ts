/**
 * ICategoryStatistics Interface
 * Provides statistics about task distribution across categories
 */
export interface CategoryTaskCount {
  /** Category ID */
  categoryId: string;
  /** Category name */
  categoryName: string;
  /** Count of tasks in this category */
  taskCount: number;
  /** Percentage of total tasks in this category (0-100) */
  percentage: number;
}

/**
 * ICategoryStatistics Interface
 * Provides statistics about task distribution across categories
 */
export interface ICategoryStatistics {
  /** Statistics per category */
  categories: CategoryTaskCount[];
  /** Count of tasks with no category assigned */
  uncategorized: number;
  /** Total number of tasks across all categories */
  total: number;
}
