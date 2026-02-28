import type { IBaseEntity } from './IBaseEntity.js';

/**
 * ITaskCategory Interface
 * Defines the structure for task categories
 * Extends IBaseEntity for timestamp support and ID
 */
export interface ITaskCategory extends IBaseEntity {
  /** Name of the category (required, non-empty) */
  name: string;
  /** Detailed description of the category (optional) */
  description?: string;
  /** Hex color code for visual representation (optional) */
  color?: string;
}
