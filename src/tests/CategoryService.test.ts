import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from '../bll/services/CategoryService.js';
import type { IUnitOfWork } from '../interfaces/IUnitOfWork.js';
import type { ICategoryRepository } from '../interfaces/ICategoryRepository.js';
import type { ITaskRepository } from '../interfaces/ITaskRepository.js';
import type { ITaskCategory } from '../interfaces/ITaskCategory.js';

// Mock UnitOfWork
const createMockUnitOfWork = (
  categoryRepo: Partial<ICategoryRepository>,
  taskRepo: Partial<ITaskRepository> = {}
): IUnitOfWork => {
  return {
    getTaskRepository: () => taskRepo as ITaskRepository,
    getCategoryRepository: () => categoryRepo as ICategoryRepository,
    getRecurrenceTemplateRepository: vi.fn() as any,
    getRecurringTaskRepository: vi.fn() as any,
    getTaskRecurringLinkRepository: vi.fn() as any,
    initialize: vi.fn(),
    completeTaskWithRecurrence: vi.fn(),
    assignTaskToCategory: vi.fn(),
    removeTaskFromCategory: vi.fn(),
    registerNew: vi.fn(),
    registerModified: vi.fn(),
    registerDeleted: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
  };
};

describe('CategoryService', () => {
  let mockCategories: ITaskCategory[];
  let categoryRepository: ICategoryRepository;
  let categoryService: CategoryService;

  beforeEach(() => {
    mockCategories = [
      {
        id: 'cat-1',
        name: 'Work',
        description: 'Work related tasks',
        color: '#ff0000',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat-2',
        name: 'Personal',
        description: 'Personal tasks',
        color: '#00ff00',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    categoryRepository = {
      getAll: vi.fn().mockReturnValue([...mockCategories]),
      getById: vi.fn().mockImplementation((id: string) => {
        return mockCategories.find(c => c.id === id) || null;
      }),
      find: vi.fn(),
      query: vi.fn(),
      getAllAsync: vi.fn().mockResolvedValue([...mockCategories]),
      getByIdAsync: vi.fn().mockImplementation((id: string) => {
        const cat = mockCategories.find(c => c.id === id);
        return Promise.resolve(cat || null);
      }),
      createAsync: vi.fn().mockImplementation((cat: ITaskCategory) => {
        mockCategories.push(cat);
        return Promise.resolve(cat);
      }),
      updateAsync: vi.fn().mockImplementation((id: string, cat: ITaskCategory) => {
        const index = mockCategories.findIndex(c => c.id === id);
        if (index !== -1) {
          mockCategories[index] = cat;
          return Promise.resolve(cat);
        }
        return Promise.resolve(null);
      }),
      deleteAsync: vi.fn().mockImplementation((id: string) => {
        const index = mockCategories.findIndex(c => c.id === id);
        if (index !== -1) {
          mockCategories.splice(index, 1);
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      }),
      assignTaskToCategory: vi.fn().mockResolvedValue({ taskId: 'task-1', categoryId: 'cat-1' }),
      removeTaskFromCategory: vi.fn().mockResolvedValue(true),
      getCategoriesForTask: vi.fn().mockResolvedValue([mockCategories[0]]),
      getTasksForCategory: vi.fn().mockResolvedValue(['task-1']),
      getByName: vi.fn().mockImplementation((name: string) => {
        return Promise.resolve(mockCategories.find(c => c.name.toLowerCase() === name.toLowerCase()) || null);
      }),
      createBatchAsync: vi.fn().mockResolvedValue([]),
      deleteBatchAsync: vi.fn().mockResolvedValue(true),
      existsAsync: vi.fn().mockImplementation((id: string) => {
        return Promise.resolve(mockCategories.some(c => c.id === id));
      }),
    } as unknown as ICategoryRepository;

    const taskRepository = {
      getByIdAsync: vi.fn().mockImplementation((id: string) => {
        if (id === 'task-1') {
          return Promise.resolve({ id: 'task-1', title: 'Test' });
        }
        return Promise.resolve(null);
      }),
    } as unknown as ITaskRepository;

    const unitOfWork = createMockUnitOfWork(categoryRepository, taskRepository);
    categoryService = new CategoryService(unitOfWork);
  });

  describe('createAsync', () => {
    it('should create a category with valid data', async () => {
      const dto = {
        id: 'new-cat',
        name: 'New Category',
        description: 'New Description',
        color: '#0000ff',
      };

      const result = await categoryService.createAsync(dto);

      expect(result.id).toBe('new-cat');
      expect(result.name).toBe('New Category');
      expect(result.description).toBe('New Description');
    });

    it('should return existing category for duplicate name', async () => {
      const dto = {
        id: 'duplicate-cat',
        name: 'Work', // Already exists
      };

      const result = await categoryService.createAsync(dto);

      expect(result.id).toBe('cat-1');
      expect(result.name).toBe('Work');
    });

    it('should throw error for empty name', async () => {
      const dto = {
        id: 'empty-name',
        name: '   ',
      };

      await expect(categoryService.createAsync(dto)).rejects.toThrow('Category name is required');
    });
  });

  describe('updateAsync', () => {
    it('should update category name', async () => {
      const dto = { name: 'Updated Name' };

      const result = await categoryService.updateAsync('cat-1', dto);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Name');
    });

    it('should return null for non-existent category', async () => {
      const dto = { name: 'Updated' };

      const result = await categoryService.updateAsync('non-existent', dto);

      expect(result).toBeNull();
    });
  });

  describe('deleteAsync', () => {
    it('should delete existing category', async () => {
      const result = await categoryService.deleteAsync('cat-1');

      expect(result).toBe(true);
    });

    it('should return false for non-existent category', async () => {
      const result = await categoryService.deleteAsync('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getByIdAsync', () => {
    it('should return category by id', async () => {
      const result = await categoryService.getByIdAsync('cat-1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Work');
    });

    it('should return null for non-existent category', async () => {
      const result = await categoryService.getByIdAsync('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllAsync', () => {
    it('should return all categories', async () => {
      const result = await categoryService.getAllAsync();

      expect(result.length).toBe(2);
    });
  });

  describe('getByNameAsync', () => {
    it('should return category by name (case-insensitive)', async () => {
      const result = await categoryService.getByNameAsync('work');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Work');
    });

    it('should return null for non-existent name', async () => {
      const result = await categoryService.getByNameAsync('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('assignTaskToCategoryAsync', () => {
    it('should assign task to category', async () => {
      const result = await categoryService.assignTaskToCategoryAsync('task-1', 'cat-1');

      expect(result).not.toBeNull();
    });

    it('should return null for non-existent task', async () => {
      const result = await categoryService.assignTaskToCategoryAsync('non-existent', 'cat-1');

      expect(result).toBeNull();
    });

    it('should return null for non-existent category', async () => {
      const result = await categoryService.assignTaskToCategoryAsync('task-1', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('removeTaskFromCategoryAsync', () => {
    it('should remove task from category', async () => {
      const result = await categoryService.removeTaskFromCategoryAsync('task-1', 'cat-1');

      expect(result).toBe(true);
    });
  });

  describe('getCategoriesForTaskAsync', () => {
    it('should return categories for task', async () => {
      const result = await categoryService.getCategoriesForTaskAsync('task-1');

      expect(result.length).toBe(1);
    });
  });

  describe('getTasksForCategoryAsync', () => {
    it('should return tasks for category', async () => {
      const result = await categoryService.getTasksForCategoryAsync('cat-1');

      expect(result.length).toBe(1);
      expect(result[0]).toBe('task-1');
    });
  });
});
