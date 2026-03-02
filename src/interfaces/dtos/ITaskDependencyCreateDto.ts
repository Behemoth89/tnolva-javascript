import type { EDependencyType } from '../../enums/EDependencyType.js';

/**
 * ITaskDependencyCreateDto Interface
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
