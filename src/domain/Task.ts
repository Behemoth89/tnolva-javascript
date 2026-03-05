import { EStatus } from '../enums/EStatus.js';
import { EPriority } from '../enums/EPriority.js';
import type { ITaskEntity, ITaskCreateDto } from '../interfaces/index.js';

/**
 * Task Entity Class - Pure data holder
 * Business logic is handled by BLL TaskService
 */
export class Task implements ITaskEntity {
  id: string;
  title: string;
  description?: string;
  status: EStatus;
  priority: EPriority;
  startDate: Date;
  dueDate?: Date;
  completionDate?: Date;
  tags: string[];
  /** Indicates whether the task was created by the system (e.g., recurring task generator) */
  isSystemCreated?: boolean;
  createdAt: string;
  updatedAt: string;

  /**
   * Creates a new Task instance
   * @param dto - Task creation data transfer object
   * Note: Validation is handled by BLL TaskService
   */
  constructor(dto: ITaskCreateDto) {
    this.id = dto.id;
    this.title = dto.title?.trim() ?? '';
    this.description = dto.description?.trim();
    this.status = dto.status ?? EStatus.TODO;
    this.priority = dto.priority ?? EPriority.MEDIUM;
    // startDate defaults to creation timestamp if not specified
    this.startDate = dto.startDate ?? new Date();
    this.dueDate = dto.dueDate;
    this.completionDate = dto.completionDate;
    this.tags = dto.tags ? [...dto.tags] : [];
    this.isSystemCreated = dto.isSystemCreated ?? false;
    // Handle timestamps - use provided or set to now
    this.createdAt = dto.createdAt ?? new Date().toISOString();
    this.updatedAt = dto.updatedAt ?? new Date().toISOString();
  }

  /**
   * Convert to plain object
   * @returns Plain object representation
   */
  toObject(): ITaskEntity {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      startDate: this.startDate,
      dueDate: this.dueDate,
      completionDate: this.completionDate,
      tags: [...this.tags],
      isSystemCreated: this.isSystemCreated,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
