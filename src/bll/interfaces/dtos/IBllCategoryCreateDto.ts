/**
 * IBllCategoryCreateDto Interface
 * BLL-layer DTO for category creation
 */
export interface IBllCategoryCreateDto {
  /** Name of the category */
  name: string;
  /** Color associated with the category */
  color?: string;
  /** Description of the category */
  description?: string;
}
