import type { TaskCategory } from '../../domain/TaskCategory.js';
import type { ICategoryRepository } from '../../interfaces/ICategoryRepository.js';
import type { ITaskCategory } from '../../interfaces/ITaskCategory.js';
import type { ITaskCategoryAssignment } from '../../interfaces/ITaskCategoryAssignment.js';
import type { ILocalStorageAdapter } from '../adapters/ILocalStorageAdapter.js';
import { BaseRepository } from './BaseRepository.js';
import { STORAGE_KEY_CATEGORIES, STORAGE_KEY_CATEGORY_ASSIGNMENTS } from '../storageKeys.js';
import { generateGuid } from '../../utils/index.js';

/**
 * CategoryRepository Class
 * Implements ICategoryRepository extending BaseRepository<TaskCategory>
 * Handles both category CRUD and task-category assignments
 */
export class CategoryRepository extends BaseRepository<TaskCategory> implements ICategoryRepository {
  private readonly assignmentsStorageKey: string;

  /**
   * Creates a new CategoryRepository instance
   * @param storage - Local storage adapter
   */
  constructor(storage: ILocalStorageAdapter) {
    super(storage, STORAGE_KEY_CATEGORIES);
    this.assignmentsStorageKey = STORAGE_KEY_CATEGORY_ASSIGNMENTS;
  }

  /**
   * Get entity ID
   */
  protected getEntityId(entity: TaskCategory): string {
    return entity.id;
  }

  /**
   * Set entity ID
   */
  protected setEntityId(entity: TaskCategory, id: string): void {
    entity.id = id;
  }

  /**
   * Get category by name
   */
  async getByName(name: string): Promise<ITaskCategory | null> {
    const items = await this.getAllAsync();
    return items.find((category) => category.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /**
   * Get all assignments
   */
  private async getAssignmentsAsync(): Promise<ITaskCategoryAssignment[]> {
    const data = await this.storage.getItemAsync<ITaskCategoryAssignment[]>(this.assignmentsStorageKey);
    return data || [];
  }

  /**
   * Save all assignments
   */
  private async saveAssignmentsAsync(assignments: ITaskCategoryAssignment[]): Promise<void> {
    await this.storage.setItemAsync(this.assignmentsStorageKey, assignments);
  }

  /**
   * Assign a task to a category
   */
  async assignTaskToCategory(taskId: string, categoryId: string): Promise<ITaskCategoryAssignment | null> {
    // Check if category exists
    const category = await this.getByIdAsync(categoryId);
    if (!category) {
      return null;
    }

    const assignments = await this.getAssignmentsAsync();

    // Check for duplicate assignment
    const existingAssignment = assignments.find(
      (a) => a.taskId === taskId && a.categoryId === categoryId
    );
    if (existingAssignment) {
      return existingAssignment;
    }

    // Create new assignment
    const now = new Date().toISOString();
    const assignment: ITaskCategoryAssignment = {
      id: generateGuid(),
      taskId,
      categoryId,
      assignedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    assignments.push(assignment);
    await this.saveAssignmentsAsync(assignments);

    return assignment;
  }

  /**
   * Remove a task from a category
   */
  async removeTaskFromCategory(taskId: string, categoryId: string): Promise<boolean> {
    const assignments = await this.getAssignmentsAsync();
    const index = assignments.findIndex(
      (a) => a.taskId === taskId && a.categoryId === categoryId
    );

    if (index === -1) {
      return false;
    }

    assignments.splice(index, 1);
    await this.saveAssignmentsAsync(assignments);
    return true;
  }

  /**
   * Get all categories for a task
   */
  async getCategoriesForTask(taskId: string): Promise<ITaskCategory[]> {
    const assignments = await this.getAssignmentsAsync();
    const categoryIds = assignments
      .filter((a) => a.taskId === taskId)
      .map((a) => a.categoryId);

    if (categoryIds.length === 0) {
      return [];
    }

    const categories = await this.getAllAsync();
    return categories.filter((c) => categoryIds.includes(c.id));
  }

  /**
   * Get all tasks for a category
   */
  async getTasksForCategory(categoryId: string): Promise<string[]> {
    const assignments = await this.getAssignmentsAsync();
    return assignments
      .filter((a) => a.categoryId === categoryId)
      .map((a) => a.taskId);
  }
}
