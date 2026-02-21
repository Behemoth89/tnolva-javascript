import { EStatus } from '../enums/EStatus.js';
import { EPriority } from '../enums/EPriority.js';
import type { ITask } from '../interfaces/ITask.js';
import type { ITaskCreateDto } from '../interfaces/ITaskCreateDto.js';
import type { ITaskUpdateDto } from '../interfaces/ITaskUpdateDto.js';

/**
 * Task Entity Class
 * Implements ITask and provides domain logic for task management
 */
export class Task implements ITask {
  id: string;
  title: string;
  description?: string;
  status: EStatus;
  priority: EPriority;
  dueDate?: Date;
  tags: string[];

  /**
   * Creates a new Task instance
   * @param dto - Task creation data transfer object
   * @throws Error if id or title is missing/empty
   */
  constructor(dto: ITaskCreateDto) {
    // Validate required fields
    if (!dto.id || dto.id.trim() === '') {
      throw new Error('Task id is required');
    }
    if (!dto.title || dto.title.trim() === '') {
      throw new Error('Task title is required');
    }

    this.id = dto.id;
    this.title = dto.title.trim();
    this.description = dto.description?.trim();
    this.status = dto.status ?? EStatus.TODO;
    this.priority = dto.priority ?? EPriority.MEDIUM;
    this.dueDate = dto.dueDate;
    this.tags = dto.tags ? [...dto.tags] : [];
  }

  /**
   * Start the task - transition from TODO to IN_PROGRESS
   */
  start(): void {
    if (this.status === EStatus.TODO) {
      this.status = EStatus.IN_PROGRESS;
    }
  }

  /**
   * Complete the task - transition from IN_PROGRESS to DONE
   */
  complete(): void {
    if (this.status === EStatus.IN_PROGRESS) {
      this.status = EStatus.DONE;
    }
  }

  /**
   * Cancel the task - transition from any status to CANCELLED
   */
  cancel(): void {
    this.status = EStatus.CANCELLED;
  }

  /**
   * Change the priority of the task
   * @param priority - New priority level
   */
  changePriority(priority: EPriority): void {
    this.priority = priority;
  }

  /**
   * Add a tag to the task
   * @param tag - Tag to add
   */
  addTag(tag: string): void {
    const trimmedTag = tag.trim();
    if (trimmedTag && !this.tags.includes(trimmedTag)) {
      this.tags.push(trimmedTag);
    }
  }

  /**
   * Remove a tag from the task
   * @param tag - Tag to remove
   */
  removeTag(tag: string): void {
    const trimmedTag = tag.trim();
    const index = this.tags.indexOf(trimmedTag);
    if (index !== -1) {
      this.tags.splice(index, 1);
    }
  }

  /**
   * Check if the task has a specific tag
   * @param tag - Tag to check
   * @returns true if the task has the tag
   */
  hasTag(tag: string): boolean {
    return this.tags.includes(tag.trim());
  }

  /**
   * Update the task with partial data
   * @param dto - Update data transfer object
   */
  update(dto: ITaskUpdateDto): void {
    if (dto.title !== undefined) {
      if (!dto.title || dto.title.trim() === '') {
        throw new Error('Task title cannot be empty');
      }
      this.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      this.description = dto.description?.trim();
    }
    if (dto.status !== undefined) {
      this.status = dto.status;
    }
    if (dto.priority !== undefined) {
      this.priority = dto.priority;
    }
    if (dto.dueDate !== undefined) {
      this.dueDate = dto.dueDate;
    }
    if (dto.tags !== undefined) {
      this.tags = [...dto.tags];
    }
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
    };
  }
}
