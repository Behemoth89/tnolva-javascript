import type { ICategoryService } from '../interfaces/ICategoryService.js';
import type { ITaskCategoryEntity, ITaskCategoryCreateDto, ITaskCategoryUpdateDto, ITaskCategoryAssignmentEntity, IUnitOfWork, ICategoryRepository } from '../../interfaces/index.js';
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
  async createAsync(dto: ITaskCategoryCreateDto): Promise<ITaskCategoryEntity> {
    // Validate name
    if (!dto.name || dto.name.trim() === '') {
      throw new Error('Category name is required');
    }

    // Check for duplicate name (case-insensitive)
    const existing = await this.categoryRepository.getByNameAsync(dto.name.trim());
    if (existing) {
      return existing;
    }

    // Generate ID if not provided
    const id = dto.id || generateGuid();
    const now = new Date().toISOString();

    const category: ITaskCategoryEntity = {
      id,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      color: dto.color,
      createdAt: dto.createdAt ?? now,
      updatedAt: dto.updatedAt ?? now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerNew(category, 'category');
    await this.unitOfWork.commit();
    
    return category;
  }

  /**
   * Update an existing category
   */
  async updateAsync(id: string, dto: ITaskCategoryUpdateDto): Promise<ITaskCategoryEntity | null> {
    const category = await this.categoryRepository.getByIdAsync(id);
    if (!category) {
      return null;
    }

    // Validate name if provided
    if (dto.name !== undefined && (!dto.name || dto.name.trim() === '')) {
      throw new Error('Category name cannot be empty');
    }

    const now = new Date().toISOString();

    const updatedCategory: ITaskCategoryEntity = {
      ...category,
      name: dto.name !== undefined ? dto.name.trim() : category.name,
      description: dto.description !== undefined ? dto.description?.trim() : category.description,
      color: dto.color !== undefined ? dto.color : category.color,
      updatedAt: now,
    };

    // Register with UOW change tracking
    this.unitOfWork.registerModified(updatedCategory, 'category');
    await this.unitOfWork.commit();
    
    return updatedCategory;
  }

  /**
   * Delete a category
   */
  async deleteAsync(id: string): Promise<boolean> {
    const category = await this.categoryRepository.getByIdAsync(id);
    if (!category) {
      return false;
    }

    // DEBUG: Check for orphaned assignments before deletion
    const assignedTasks = await this.categoryRepository.getTasksForCategoryAsync(id);
    console.log('[CategoryService] Deleting category:', id, '| Assigned tasks:', assignedTasks.length);
    if (assignedTasks.length > 0) {
      console.warn('[CategoryService] WARNING: Category has assigned tasks - assignments will become orphaned!');
    }

    // Register with UOW change tracking
    this.unitOfWork.registerDeleted(category, 'category');
    try {
      await this.unitOfWork.commit();
      return true;
    } catch (error) {
      console.error('[CategoryService] Error committing category deletion:', error);
      return false;
    }
  }

  /**
   * Get a category by ID
   */
  /**
   * Retrieves a task category by its identifier.
   * @param {string} id - The unique identifier of the category to retrieve.
   * @returns {Promise<ITaskCategoryEntity | null>} A promise that resolves to the task category entity if found, or null if not found.
   */
  async getByIdAsync(id: string): Promise<ITaskCategoryEntity | null> {
    return this.categoryRepository.getByIdAsync(id);
  }

  /**
   * Get all categories
   */
  async getAllAsync(): Promise<ITaskCategoryEntity[]> {
    return this.categoryRepository.getAllAsync();
  }

  /**
   * Get category by name (case-insensitive)
   */
  async getByNameAsync(name: string): Promise<ITaskCategoryEntity | null> {
    return this.categoryRepository.getByNameAsync(name);
  }

  /**
   * Assign a task to a category
   */
  async assignTaskToCategoryAsync(taskId: string, categoryId: string): Promise<ITaskCategoryAssignmentEntity | null> {
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

    return this.categoryRepository.assignTaskToCategoryAsync(taskId, categoryId);
  }

  /**
   * Remove a task from a category
   */
  async removeTaskFromCategoryAsync(taskId: string, categoryId: string): Promise<boolean> {
    return this.categoryRepository.removeTaskFromCategoryAsync(taskId, categoryId);
  }

  /**
   * Get all categories for a task
   */
  async getCategoriesForTaskAsync(taskId: string): Promise<ITaskCategoryEntity[]> {
    return this.categoryRepository.getCategoriesForTaskAsync(taskId);
  }

  /**
   * Get all task IDs for a category
   */
  async getTasksForCategoryAsync(categoryId: string): Promise<string[]> {
    return this.categoryRepository.getTasksForCategoryAsync(categoryId);
  }
}
