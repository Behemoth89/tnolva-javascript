import type { IBaseEntity } from './IBaseEntity.js';
import type { EDependencyType } from '../enums/EDependencyType.js';

/**
 * ITaskDependency Interface
 * Defines the structure for task dependency (junction table) objects
 * Extends IBaseEntity for timestamp support
 */
export interface ITaskDependency extends IBaseEntity {
  /** The dependent task ID (child/subtask) */
  taskId: string;
  /** The task being depended on (parent/main task) */
  dependsOnTaskId: string;
  /** Type of dependency */
  dependencyType: EDependencyType;
}

/**
 * Data transfer object for creating a new task dependency
 */
export interface ITaskDependencyCreateDto {
  /** The dependent task ID (child/subtask) */
  taskId: string;
  /** The task being depended on (parent/main task) */
  dependsOnTaskId: string;
  /** Type of dependency (optional, defaults to SUBTASK) */
  dependencyType?: EDependencyType;
}
