/**
 * IBllCategoryDto Interface
 * BLL-layer DTO for category display
 * Includes taskCount for UI display
 */
export interface IBllCategoryDto {
  /** Unique identifier for the category */
  id: string;
  /** Name of the category */
  name: string;
  /** Color associated with the category */
  color?: string;
  /** Description of the category */
  description?: string;
  /** Number of tasks assigned to this category (optional - can be populated when needed) */
  taskCount?: number;
  /** Creation timestamp in ISO 8601 format */
  createdAt: string;
  /** Last update timestamp in ISO 8601 format */
  updatedAt: string;
}
