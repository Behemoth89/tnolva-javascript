/**
 * ITaskCategoryUpdateDto Interface
 * Interface for updating existing task categories
 * All fields are optional to allow partial updates
 */
export interface ITaskCategoryUpdateDto {
  /** Unique identifier for the category */
  id?: string;
  /** Name of the category */
  name?: string;
  /** Detailed description of the category */
  description?: string;
  /** Hex color code for visual representation */
  color?: string;
  /** Last update timestamp in ISO 8601 format (optional, set by repository if not provided) */
  updatedAt?: string;
}
