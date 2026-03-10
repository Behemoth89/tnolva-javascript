import type { IBaseEntity } from '../index.js';
import type { EDependencyType } from '../../enums/EDependencyType.js';

/**
 * ITaskDependencyEntity Interface
 * Defines the structure for task dependency (junction table) objects
 * Extends IBaseEntity for timestamp support
 */
export interface ITaskDependencyEntity extends IBaseEntity {
  /** The dependent task ID (child/subtask) */
  taskId: string;
  /** The task being depended on (parent/main task) */
  dependsOnTaskId: string;
  /** Type of dependency */
  dependencyType: EDependencyType;
}
