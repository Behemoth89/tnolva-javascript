import { EStatus } from '../enums/EStatus.js';
import { EPriority } from '../enums/EPriority.js';
import type { ITask } from '../interfaces/ITask.js';
import type { ITaskCreateDto } from '../interfaces/ITaskCreateDto.js';

/**
 * Task Entity Class - Pure data holder
 * Business logic is handled by BLL TaskService
 */
export class Task implements ITask {
  id: string;
  title: string;
  description?: string;
  status: EStatus;
  priority: EPriority;
  dueDate?: Date;
  tags: string[];
  /** Reference to a recurrence template for repeating tasks */
  recurrenceTemplateId?: string;
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
    this.dueDate = dto.dueDate;
    this.tags = dto.tags ? [...dto.tags] : [];
    this.recurrenceTemplateId = dto.recurrenceTemplateId;
    // Handle timestamps - use provided or set to now
    this.createdAt = dto.createdAt ?? new Date().toISOString();
    this.updatedAt = dto.updatedAt ?? new Date().toISOString();
  }

  /**
   * Convert to plain object
   * @returns Plain object representation
   */
  toObject(): ITask {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      tags: [...this.tags],
      recurrenceTemplateId: this.recurrenceTemplateId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
