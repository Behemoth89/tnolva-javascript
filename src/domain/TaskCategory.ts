import type { ITaskCategory } from '../interfaces/ITaskCategory.js';
import type { ITaskCategoryCreateDto } from '../interfaces/ITaskCategoryCreateDto.js';

/**
 * TaskCategory Entity Class - Pure data holder
 * Business logic is handled by BLL CategoryService
 */
export class TaskCategory implements ITaskCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;

  /**
   * Creates a new TaskCategory instance
   * @param dto - Category creation data transfer object
   * Note: Validation is handled by BLL CategoryService
   */
  constructor(dto: ITaskCategoryCreateDto) {
    this.id = dto.id;
    this.name = dto.name?.trim() ?? '';
    this.description = dto.description?.trim();
    this.color = dto.color;
    // Handle timestamps - use provided or set to now
    this.createdAt = dto.createdAt ?? new Date().toISOString();
    this.updatedAt = dto.updatedAt ?? new Date().toISOString();
  }

  /**
   * Convert to plain object
   * @returns Plain object representation
   */
  toObject(): ITaskCategory {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      color: this.color,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
