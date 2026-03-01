import type { ICategoryService } from '../interfaces/ICategoryService.js';
import type { ITaskCategory } from '../../interfaces/ITaskCategory.js';
import type { ITaskCategoryCreateDto } from '../../interfaces/ITaskCategoryCreateDto.js';
import type { ITaskCategoryUpdateDto } from '../../interfaces/ITaskCategoryUpdateDto.js';
import type { ITaskCategoryAssignment } from '../../interfaces/ITaskCategoryAssignment.js';
import type { IUnitOfWork } from '../../interfaces/IUnitOfWork.js';
import type { ICategoryRepository } from '../../interfaces/ICategoryRepository.js';
import { generateGuid } from '../../utils/index.js';

/**
 * CategoryService Class
 * Implements business logic for category operations
 */
export class CategoryService implements ICategoryService {
  private readonly unitOfWork: IUnitOfWork;
  private readonly categoryRepository: ICategoryRepository;

  /**
   * Creates a new CategoryService instance
   * @param unitOfWork - The UnitOfWork for data access
   */
  constructor(unitOfWork: IUnitOfWork) {
    this.unitOfWork = unitOfWork;
    this.categoryRepository = unitOfWork.getCategoryRepository();
  }

  /**
   * Create a new category
   * Returns existing category if duplicate name (case-insensitive)
   */
  async createAsync(dto: ITaskCategoryCreateDto): Promise<ITaskCategory> {
    // Validate name
    if (!dto.name || dto.name.trim() === '') {
      throw new Error('Category name is required');
    }

    // Check for duplicate name (case-insensitive)
    const existing = await this.categoryRepository.getByName(dto.name.trim());
    if (existing) {
      return existing;
    }

    // Generate ID if not provided
    const id = dto.id || generateGuid();
    const now = new Date().toISOString();

    const category: ITaskCategory = {
      id,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      color: dto.color,
      createdAt: dto.createdAt ?? now,
      updatedAt: dto.updatedAt ?? now,
    };

    await this.categoryRepository.createAsync(category);
    return category;
  }

  /**
   * Update an existing category
   */
  async updateAsync(id: string, dto: ITaskCategoryUpdateDto): Promise<ITaskCategory | null> {
    const category = await this.categoryRepository.getByIdAsync(id);
    if (!category) {
      return null;
    }

    // Validate name if provided
    if (dto.name !== undefined && (!dto.name || dto.name.trim() === '')) {
      throw new Error('Category name cannot be empty');
    }

    const now = new Date().toISOString();

    const updatedCategory: ITaskCategory = {
      ...category,
      name: dto.name !== undefined ? dto.name.trim() : category.name,
      description: dto.description !== undefined ? dto.description?.trim() : category.description,
      color: dto.color !== undefined ? dto.color : category.color,
      updatedAt: now,
    };

    await this.categoryRepository.updateAsync(id, updatedCategory);
    return updatedCategory;
  }

  /**
   * Delete a category
   */
  async deleteAsync(id: string): Promise<boolean> {
    return this.categoryRepository.deleteAsync(id);
  }

  /**
   * Get a category by ID
   */
  async getByIdAsync(id: string): Promise<ITaskCategory | null> {
    return this.categoryRepository.getByIdAsync(id);
  }

  /**
   * Get all categories
   */
  async getAllAsync(): Promise<ITaskCategory[]> {
    return this.categoryRepository.getAllAsync();
  }

  /**
   * Get category by name (case-insensitive)
   */
  async getByNameAsync(name: string): Promise<ITaskCategory | null> {
    return this.categoryRepository.getByName(name);
  }

  /**
   * Assign a task to a category
   */
  async assignTaskToCategoryAsync(taskId: string, categoryId: string): Promise<ITaskCategoryAssignment | null> {
    // Validate task exists
    const taskRepo = this.unitOfWork.getTaskRepository();
    const task = await taskRepo.getByIdAsync(taskId);
    if (!task) {
      return null;
    }

    // Validate category exists
    const category = await this.categoryRepository.getByIdAsync(categoryId);
    if (!category) {
      return null;
    }

    return this.categoryRepository.assignTaskToCategory(taskId, categoryId);
  }

  /**
   * Remove a task from a category
   */
  async removeTaskFromCategoryAsync(taskId: string, categoryId: string): Promise<boolean> {
    return this.categoryRepository.removeTaskFromCategory(taskId, categoryId);
  }

  /**
   * Get all categories for a task
   */
  async getCategoriesForTaskAsync(taskId: string): Promise<ITaskCategory[]> {
    return this.categoryRepository.getCategoriesForTask(taskId);
  }

  /**
   * Get all task IDs for a category
   */
  async getTasksForCategoryAsync(categoryId: string): Promise<string[]> {
    return this.categoryRepository.getTasksForCategory(categoryId);
  }
}
