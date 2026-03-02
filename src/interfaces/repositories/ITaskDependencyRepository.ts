import type { ITaskDependencyEntity } from '../index.js';

/**
 * ITaskDependencyRepository Interface
 * Defines repository operations for task dependencies
 */
export interface ITaskDependencyRepository {
  /**
   * Get all dependencies
   */
  getAll(): ITaskDependencyEntity[];

  /**
   * Get all dependencies asynchronously
   */
  getAllAsync(): Promise<ITaskDependencyEntity[]>;

  /**
   * Get a dependency by ID
   */
  getById(id: string): ITaskDependencyEntity | null;

  /**
   * Get a dependency by ID asynchronously
   */
  getByIdAsync(id: string): Promise<ITaskDependencyEntity | null>;

  /**
   * Get all dependencies for a task (tasks this task depends on)
   * @param taskId - The task ID
   */
  getDependenciesForTask(taskId: string): ITaskDependencyEntity[];

  /**
   * Get all dependencies for a task asynchronously
   * @param taskId - The task ID
   */
  getDependenciesForTaskAsync(taskId: string): Promise<ITaskDependencyEntity[]>;

  /**
   * Get all dependents for a task (tasks that depend on this task)
   * @param taskId - The task ID
   */
  getDependents(taskId: string): ITaskDependencyEntity[];

  /**
   * Get all dependents for a task asynchronously
   * @param taskId - The task ID
   */
  getDependentsAsync(taskId: string): Promise<ITaskDependencyEntity[]>;

  /**
   * Check if a dependency exists between two tasks
   * @param taskId - The dependent task ID
   * @param dependsOnTaskId - The task being depended on
   */
  hasDependency(taskId: string, dependsOnTaskId: string): boolean;

  /**
   * Check if a dependency exists between two tasks asynchronously
   * @param taskId - The dependent task ID
   * @param dependsOnTaskId - The task being depended on
   */
  hasDependencyAsync(taskId: string, dependsOnTaskId: string): Promise<boolean>;

  /**
   * Create a new dependency
   */
  createAsync(entity: ITaskDependencyEntity): Promise<ITaskDependencyEntity>;

  /**
   * Update an existing dependency
   */
  updateAsync(id: string, entity: ITaskDependencyEntity): Promise<ITaskDependencyEntity | null>;

  /**
   * Delete a dependency by ID
   */
  deleteAsync(id: string): Promise<boolean>;

  /**
   * Delete all dependencies for a task (as task_id)
   * @param taskId - The task ID
   */
  deleteByTaskId(taskId: string): Promise<number>;

  /**
   * Delete all dependencies where the task is the depended-on task (as depends_on_task_id)
   * @param taskId - The task ID
   */
  deleteByDependsOnTaskId(taskId: string): Promise<number>;
}
