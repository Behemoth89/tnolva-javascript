/**
 * ITaskCategoryCreateDto Interface
 * Interface for creating new task categories
 */
export interface ITaskCategoryCreateDto {
  /** Unique identifier for the category (required) */
  id: string;
  /** Name of the category (required, non-empty) */
  name: string;
  /** Detailed description of the category (optional) */
  description?: string;
  /** Hex color code for visual representation (optional) */
  color?: string;
  /** Creation timestamp in ISO 8601 format (optional, set by repository if not provided) */
  createdAt?: string;
  /** Last update timestamp in ISO 8601 format (optional, set by repository if not provided) */
  updatedAt?: string;
}
