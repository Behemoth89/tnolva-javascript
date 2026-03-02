import type { ITaskDependency, ITaskDependencyCreateDto } from '../interfaces/ITaskDependency.js';
import { EDependencyType } from '../enums/EDependencyType.js';
import { generateGuid } from '../utils/index.js';

/**
 * TaskDependency Entity Class - Pure data holder
 * Represents a junction table record for task dependencies
 */
export class TaskDependency implements ITaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: EDependencyType;
  createdAt: string;
  updatedAt: string;

  /**
   * Creates a new TaskDependency instance
   * @param dto - TaskDependency creation data
   */
  constructor(dto: ITaskDependencyCreateDto) {
    this.id = generateGuid();
    this.taskId = dto.taskId;
    this.dependsOnTaskId = dto.dependsOnTaskId;
    this.dependencyType = dto.dependencyType ?? EDependencyType.SUBTASK;
    const now = new Date().toISOString();
    this.createdAt = now;
    this.updatedAt = now;
  }

  /**
   * Convert to plain object
   * @returns Plain object representation
   */
  toObject(): ITaskDependency {
    return {
      id: this.id,
      taskId: this.taskId,
      dependsOnTaskId: this.dependsOnTaskId,
      dependencyType: this.dependencyType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
