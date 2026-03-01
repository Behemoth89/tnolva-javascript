import type { IRecurringTask, IRecurringTaskCreateDto } from '../interfaces/IRecurringTask.js';
import { ERecurringTaskStatus } from '../enums/ERecurringTaskStatus.js';
import { EPriority } from '../enums/EPriority.js';
import { generateGuid } from '../utils/index.js';

/**
 * RecurringTask Domain Class - Pure data holder
 * Business logic is handled by BLL RecurringTaskService
 */
export class RecurringTask implements IRecurringTask {
  id: string;
  title: string;
  description?: string;
  priority: EPriority;
  startDate: Date;
  endDate?: Date;
  intervals: import('../interfaces/IInterval.js').IInterval[];
  tags: string[];
  categoryIds: string[];
  status: ERecurringTaskStatus;
  createdAt: string;
  updatedAt: string;

  /**
   * Creates a new RecurringTask instance
   * @param dto - Recurring task creation data transfer object
   * Note: Validation is handled by BLL RecurringTaskService
   */
  constructor(dto: IRecurringTaskCreateDto & { id?: string }) {
    this.id = dto.id || generateGuid();
    this.title = dto.title?.trim() ?? '';
    this.description = dto.description?.trim();
    this.priority = dto.priority ?? EPriority.MEDIUM;
    this.startDate = dto.startDate;
    this.endDate = dto.endDate;
    this.intervals = dto.intervals ? [...dto.intervals] : [];
    this.tags = dto.tags ? [...dto.tags] : [];
    this.categoryIds = dto.categoryIds ? [...dto.categoryIds] : [];
    this.status = ERecurringTaskStatus.ACTIVE;
    // Handle timestamps
    const now = new Date().toISOString();
    this.createdAt = now;
    this.updatedAt = now;
  }

  /**
   * Create a RecurringTask from an existing IRecurringTask object
   * @param existing - Existing IRecurringTask object
   */
  static fromExisting(existing: IRecurringTask): RecurringTask {
    const task = new RecurringTask({
      title: existing.title,
      description: existing.description,
      priority: existing.priority,
      startDate: existing.startDate,
      endDate: existing.endDate,
      intervals: existing.intervals,
      tags: existing.tags,
      categoryIds: existing.categoryIds,
    });
    task.id = existing.id;
    task.status = existing.status;
    task.createdAt = existing.createdAt;
    task.updatedAt = existing.updatedAt;
    return task;
  }

  /**
   * Convert to plain object
   * @returns Plain object representation
   */
  toObject(): IRecurringTask {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      priority: this.priority,
      startDate: this.startDate,
      endDate: this.endDate,
      intervals: [...this.intervals],
      tags: [...this.tags],
      categoryIds: [...this.categoryIds],
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Check if the recurring task is active
   * @returns true if status is ACTIVE
   */
  isActive(): boolean {
    return this.status === ERecurringTaskStatus.ACTIVE;
  }

  /**
   * Check if the recurring task has an end date
   * @returns true if endDate is set
   */
  hasEndDate(): boolean {
    return this.endDate !== undefined && this.endDate !== null;
  }

  /**
   * Check if the recurring task is indefinite (no end date)
   * @returns true if no end date is set
   */
  isIndefinite(): boolean {
    return !this.hasEndDate();
  }
}
