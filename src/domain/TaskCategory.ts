import type { ITaskCategory } from '../interfaces/ITaskCategory.js';
import type { ITaskCategoryCreateDto } from '../interfaces/ITaskCategoryCreateDto.js';
import type { ITaskCategoryUpdateDto } from '../interfaces/ITaskCategoryUpdateDto.js';

/**
 * TaskCategory Entity Class
 * Implements ITaskCategory and provides domain logic for category management
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
   * @throws Error if id or name is missing/empty
   */
  constructor(dto: ITaskCategoryCreateDto) {
    // Validate required fields
    if (!dto.id || dto.id.trim() === '') {
      throw new Error('Category id is required');
    }
    if (!dto.name || dto.name.trim() === '') {
      throw new Error('Category name is required');
    }

    this.id = dto.id;
    this.name = dto.name.trim();
    this.description = dto.description?.trim();
    this.color = dto.color;
    // Handle timestamps - use provided or set to now
    this.createdAt = dto.createdAt ?? new Date().toISOString();
    this.updatedAt = dto.updatedAt ?? new Date().toISOString();
  }

  /**
   * Update the category with partial data
   * @param dto - Update data transfer object
   */
  update(dto: ITaskCategoryUpdateDto): void {
    if (dto.name !== undefined) {
      if (!dto.name || dto.name.trim() === '') {
        throw new Error('Category name cannot be empty');
      }
      this.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      this.description = dto.description?.trim();
    }
    if (dto.color !== undefined) {
      this.color = dto.color;
    }
    // Update timestamp
    this.updatedAt = new Date().toISOString();
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
