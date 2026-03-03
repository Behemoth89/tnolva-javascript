import { describe, it, expect, vi } from 'vitest';
import { StatisticsService } from '../bll/services/StatisticsService.js';
import type { IUnitOfWork, ITaskRepository, ITaskEntity, ITaskCategoryEntity, ITaskCategoryAssignmentEntity, IRecurringTaskEntity, ITaskDependencyEntity, IRecurrenceTemplateRepository, IRecurringTaskRepository, ITaskDependencyRepository, ITaskRecurringLinkRepository, ICategoryRepository } from '../interfaces/index.js';
import { EStatus, EPriority, ERecurringTaskStatus } from '../enums/index.js';

// Mock UnitOfWork
const createMockUnitOfWork = (options: {
  tasks?: ITaskEntity[];
  categories?: ITaskCategoryEntity[];
  assignments?: ITaskCategoryAssignmentEntity[];
  recurringTasks?: IRecurringTaskEntity[];
  dependencies?: ITaskDependencyEntity[];
  taskRecurringLinks?: any[];
}): IUnitOfWork => {
  const mockTaskRepo = {
    getAll: vi.fn().mockReturnValue(options.tasks || []),
    getAllAsync: vi.fn().mockResolvedValue(options.tasks || []),
    getById: vi.fn(),
    getByIdAsync: vi.fn(),
    create: vi.fn(),
    createAsync: vi.fn(),
    update: vi.fn(),
    updateAsync: vi.fn(),
    delete: vi.fn(),
    deleteAsync: vi.fn(),
    find: vi.fn(),
    findAsync: vi.fn(),
    getByStatus: vi.fn().mockReturnValue([]),
    getByStatusAsync: vi.fn().mockResolvedValue([]),
    getByPriority: vi.fn().mockReturnValue([]),
    getByPriorityAsync: vi.fn().mockResolvedValue([]),
    query: vi.fn(),
    queryAsync: vi.fn().mockResolvedValue([]),
    createBatchAsync: vi.fn().mockResolvedValue([]),
    deleteBatchAsync: vi.fn().mockResolvedValue(0),
    existsAsync: vi.fn().mockResolvedValue(false),
  };

  const mockCategoryRepo = {
    getAll: vi.fn().mockReturnValue(options.categories || []),
    getAllAsync: vi.fn().mockResolvedValue(options.categories || []),
    getAllAssignmentsAsync: vi.fn().mockResolvedValue(options.assignments || []),
    getById: vi.fn(),
    getByIdAsync: vi.fn(),
    create: vi.fn(),
    createAsync: vi.fn(),
    update: vi.fn(),
    updateAsync: vi.fn(),
    delete: vi.fn(),
    deleteAsync: vi.fn(),
    find: vi.fn(),
    findAsync: vi.fn(),
    getByNameAsync: vi.fn(),
    assignTaskToCategoryAsync: vi.fn(),
    removeTaskFromCategoryAsync: vi.fn(),
    getCategoriesForTaskAsync: vi.fn(),
    getTasksForCategoryAsync: vi.fn(),
    query: vi.fn(),
    queryAsync: vi.fn().mockResolvedValue([]),
    createBatchAsync: vi.fn().mockResolvedValue([]),
    deleteBatchAsync: vi.fn().mockResolvedValue(0),
    existsAsync: vi.fn().mockResolvedValue(false),
  };

  const mockRecurringTaskRepo = {
    getAll: vi.fn().mockReturnValue(options.recurringTasks || []),
    getAllAsync: vi.fn().mockResolvedValue(options.recurringTasks || []),
    getById: vi.fn(),
    getByIdAsync: vi.fn(),
    create: vi.fn(),
    createAsync: vi.fn(),
    update: vi.fn(),
    updateAsync: vi.fn(),
    delete: vi.fn(),
    deleteAsync: vi.fn(),
    find: vi.fn(),
    findAsync: vi.fn(),
    getByStatus: vi.fn().mockReturnValue([]),
    getByStatusAsync: vi.fn().mockResolvedValue([]),
    getActive: vi.fn().mockReturnValue([]),
    getActiveAsync: vi.fn().mockResolvedValue([]),
    query: vi.fn(),
    queryAsync: vi.fn().mockResolvedValue([]),
    createBatchAsync: vi.fn().mockResolvedValue([]),
    deleteBatchAsync: vi.fn().mockResolvedValue(0),
    existsAsync: vi.fn().mockResolvedValue(false),
  };

  const mockTaskDependencyRepo = {
    getAll: vi.fn().mockReturnValue(options.dependencies || []),
    getAllAsync: vi.fn().mockResolvedValue(options.dependencies || []),
    getById: vi.fn(),
    getByIdAsync: vi.fn(),
    create: vi.fn(),
    createAsync: vi.fn(),
    update: vi.fn(),
    updateAsync: vi.fn(),
    delete: vi.fn(),
    deleteAsync: vi.fn(),
    find: vi.fn(),
    findAsync: vi.fn(),
    getDependenciesForTask: vi.fn().mockReturnValue([]),
    getDependenciesForTaskAsync: vi.fn().mockResolvedValue([]),
    getDependents: vi.fn().mockReturnValue([]),
    getDependentsAsync: vi.fn().mockResolvedValue([]),
    hasDependency: vi.fn().mockReturnValue(false),
    hasDependencyAsync: vi.fn().mockResolvedValue(false),
    deleteByTaskIdAsync: vi.fn().mockResolvedValue(0),
    deleteByDependsOnTaskIdAsync: vi.fn().mockResolvedValue(0),
    query: vi.fn(),
    queryAsync: vi.fn().mockResolvedValue([]),
    createBatchAsync: vi.fn().mockResolvedValue([]),
    deleteBatchAsync: vi.fn().mockResolvedValue(0),
    existsAsync: vi.fn().mockResolvedValue(false),
  };

  const mockTaskRecurringLinkRepo = {
    getAll: vi.fn().mockReturnValue(options.taskRecurringLinks || []),
    getAllAsync: vi.fn().mockResolvedValue(options.taskRecurringLinks || []),
    getById: vi.fn(),
    getByIdAsync: vi.fn(),
    create: vi.fn(),
    createAsync: vi.fn(),
    update: vi.fn(),
    updateAsync: vi.fn(),
    delete: vi.fn(),
    deleteAsync: vi.fn(),
    find: vi.fn(),
    findAsync: vi.fn(),
    getByRecurringTaskId: vi.fn().mockReturnValue([]),
    getByRecurringTaskIdAsync: vi.fn().mockResolvedValue([]),
    getByTaskId: vi.fn().mockReturnValue([]),
    getByTaskIdAsync: vi.fn().mockResolvedValue([]),
    getByBothIds: vi.fn().mockReturnValue(null),
    getByBothIdsAsync: vi.fn().mockResolvedValue(null),
    deleteByRecurringTaskIdAsync: vi.fn().mockResolvedValue(0),
    deleteByTaskIdAsync: vi.fn().mockResolvedValue(0),
    query: vi.fn(),
    queryAsync: vi.fn().mockResolvedValue([]),
    createBatchAsync: vi.fn().mockResolvedValue([]),
    deleteBatchAsync: vi.fn().mockResolvedValue(0),
    existsAsync: vi.fn().mockResolvedValue(false),
  };

  const mockRecurrenceTemplateRepo = {
    getAll: vi.fn().mockReturnValue([]),
    getAllAsync: vi.fn().mockResolvedValue([]),
    getById: vi.fn(),
    getByIdAsync: vi.fn(),
    create: vi.fn(),
    createAsync: vi.fn(),
    update: vi.fn(),
    updateAsync: vi.fn(),
    delete: vi.fn(),
    deleteAsync: vi.fn(),
    find: vi.fn(),
    findAsync: vi.fn(),
    query: vi.fn(),
    queryAsync: vi.fn().mockResolvedValue([]),
    createBatchAsync: vi.fn().mockResolvedValue([]),
    deleteBatchAsync: vi.fn().mockResolvedValue(0),
    existsAsync: vi.fn().mockResolvedValue(false),
    initializeAsync: vi.fn(),
  };

  return {
    getTaskRepository: () => mockTaskRepo as unknown as ITaskRepository,
    getCategoryRepository: () => mockCategoryRepo as unknown as ICategoryRepository,
    getRecurrenceTemplateRepository: () => mockRecurrenceTemplateRepo as unknown as IRecurrenceTemplateRepository,
    getRecurringTaskRepository: () => mockRecurringTaskRepo as unknown as IRecurringTaskRepository,
    getTaskRecurringLinkRepository: () => mockTaskRecurringLinkRepo as unknown as ITaskRecurringLinkRepository,
    getTaskDependencyRepository: () => mockTaskDependencyRepo as unknown as ITaskDependencyRepository,
    initializeAsync: vi.fn(),
    completeTaskWithRecurrenceAsync: vi.fn(),
    assignTaskToCategoryAsync: vi.fn(),
    removeTaskFromCategoryAsync: vi.fn(),
    registerNew: vi.fn(),
    registerModified: vi.fn(),
    registerDeleted: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn(),
  };
};

describe('StatisticsService', () => {
  describe('getTaskStatusStatistics', () => {
    it('should return zero counts for empty task list', () => {
      const mockUnitOfWork = createMockUnitOfWork({ tasks: [] });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getTaskStatusStatistics();
      
      expect(result.todo).toBe(0);
      expect(result.inProgress).toBe(0);
      expect(result.done).toBe(0);
      expect(result.cancelled).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should correctly count tasks by status', () => {
      const tasks: ITaskEntity[] = [
        { id: '1', title: 'Task 1', status: EStatus.TODO, priority: EPriority.LOW, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', title: 'Task 2', status: EStatus.TODO, priority: EPriority.MEDIUM, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', title: 'Task 3', status: EStatus.IN_PROGRESS, priority: EPriority.HIGH, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '4', title: 'Task 4', status: EStatus.DONE, priority: EPriority.URGENT, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '5', title: 'Task 5', status: EStatus.CANCELLED, priority: EPriority.LOW, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const mockUnitOfWork = createMockUnitOfWork({ tasks });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getTaskStatusStatistics();
      
      expect(result.todo).toBe(2);
      expect(result.inProgress).toBe(1);
      expect(result.done).toBe(1);
      expect(result.cancelled).toBe(1);
      expect(result.total).toBe(5);
    });

    it('should calculate percentages correctly', () => {
      const tasks: ITaskEntity[] = [
        { id: '1', title: 'Task 1', status: EStatus.TODO, priority: EPriority.LOW, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', title: 'Task 2', status: EStatus.DONE, priority: EPriority.MEDIUM, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const mockUnitOfWork = createMockUnitOfWork({ tasks });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getTaskStatusStatistics();
      
      expect(result.percentages.todo).toBe(50);
      expect(result.percentages.done).toBe(50);
    });
  });

  describe('getTaskPriorityStatistics', () => {
    it('should return zero counts for empty task list', () => {
      const mockUnitOfWork = createMockUnitOfWork({ tasks: [] });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getTaskPriorityStatistics();
      
      expect(result.low).toBe(0);
      expect(result.medium).toBe(0);
      expect(result.high).toBe(0);
      expect(result.urgent).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should correctly count tasks by priority', () => {
      const tasks: ITaskEntity[] = [
        { id: '1', title: 'Task 1', status: EStatus.TODO, priority: EPriority.LOW, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', title: 'Task 2', status: EStatus.TODO, priority: EPriority.LOW, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', title: 'Task 3', status: EStatus.IN_PROGRESS, priority: EPriority.MEDIUM, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '4', title: 'Task 4', status: EStatus.DONE, priority: EPriority.HIGH, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '5', title: 'Task 5', status: EStatus.DONE, priority: EPriority.URGENT, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const mockUnitOfWork = createMockUnitOfWork({ tasks });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getTaskPriorityStatistics();
      
      expect(result.low).toBe(2);
      expect(result.medium).toBe(1);
      expect(result.high).toBe(1);
      expect(result.urgent).toBe(1);
      expect(result.total).toBe(5);
    });
  });

  describe('getTaskTimeStatistics', () => {
    it('should return zero counts for empty task list', () => {
      const mockUnitOfWork = createMockUnitOfWork({ tasks: [] });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getTaskTimeStatistics();
      
      expect(result.overdue).toBe(0);
      expect(result.dueToday).toBe(0);
      expect(result.dueThisWeek).toBe(0);
      expect(result.completedThisPeriod).toBe(0);
    });

    it('should count overdue tasks correctly', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const tasks: ITaskEntity[] = [
        { id: '1', title: 'Task 1', status: EStatus.TODO, priority: EPriority.LOW, startDate: new Date(), dueDate: pastDate, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', title: 'Task 2', status: EStatus.DONE, priority: EPriority.MEDIUM, startDate: new Date(), dueDate: pastDate, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', title: 'Task 3', status: EStatus.TODO, priority: EPriority.HIGH, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const mockUnitOfWork = createMockUnitOfWork({ tasks });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getTaskTimeStatistics();
      
      // Task 1 is overdue (not DONE or CANCELLED, past due date)
      // Task 2 is not overdue (status is DONE)
      // Task 3 has no due date
      expect(result.overdue).toBe(1);
    });
  });

  describe('getCategoryStatistics', () => {
    it('should return zero counts for empty categories', async () => {
      const mockUnitOfWork = createMockUnitOfWork({ tasks: [], categories: [], assignments: [] });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = await statisticsService.getCategoryStatistics();
      
      expect(result.categories).toHaveLength(0);
      expect(result.uncategorized).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should count tasks per category correctly', async () => {
      const tasks: ITaskEntity[] = [
        { id: 'task-1', title: 'Task 1', status: EStatus.TODO, priority: EPriority.LOW, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'task-2', title: 'Task 2', status: EStatus.TODO, priority: EPriority.MEDIUM, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'task-3', title: 'Task 3', status: EStatus.DONE, priority: EPriority.HIGH, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const categories: ITaskCategoryEntity[] = [
        { id: 'cat-1', name: 'Work', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'cat-2', name: 'Personal', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const assignments: ITaskCategoryAssignmentEntity[] = [
        { id: 'assign-1', taskId: 'task-1', categoryId: 'cat-1', assignedAt: '2024-01-01', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'assign-2', taskId: 'task-2', categoryId: 'cat-1', assignedAt: '2024-01-01', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'assign-3', taskId: 'task-3', categoryId: 'cat-2', assignedAt: '2024-01-01', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const mockUnitOfWork = createMockUnitOfWork({ tasks, categories, assignments });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = await statisticsService.getCategoryStatistics();
      
      expect(result.total).toBe(3);
      expect(result.categories).toHaveLength(2);
      expect(result.uncategorized).toBe(0);
      
      const workCat = result.categories.find(c => c.categoryName === 'Work');
      const personalCat = result.categories.find(c => c.categoryName === 'Personal');
      
      expect(workCat?.taskCount).toBe(2);
      expect(personalCat?.taskCount).toBe(1);
    });

    it('should count uncategorized tasks', async () => {
      const tasks: ITaskEntity[] = [
        { id: 'task-1', title: 'Task 1', status: EStatus.TODO, priority: EPriority.LOW, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'task-2', title: 'Task 2', status: EStatus.TODO, priority: EPriority.MEDIUM, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const mockUnitOfWork = createMockUnitOfWork({ tasks, categories: [], assignments: [] });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = await statisticsService.getCategoryStatistics();
      
      expect(result.total).toBe(2);
      expect(result.uncategorized).toBe(2);
      expect(result.categories).toHaveLength(0);
    });
  });

  describe('getRecurringTaskStatistics', () => {
    it('should return zero counts for empty recurring tasks', () => {
      const mockUnitOfWork = createMockUnitOfWork({ recurringTasks: [], taskRecurringLinks: [], tasks: [] });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getRecurringTaskStatistics();
      
      expect(result.activeTemplates).toBe(0);
      expect(result.generatedTasksPerTemplate).toHaveLength(0);
      expect(result.manuallyCreatedTasks).toBe(0);
      expect(result.generatedRecurringTasks).toBe(0);
    });

    it('should count active templates correctly', () => {
      const recurringTasks: IRecurringTaskEntity[] = [
        { id: 'rt-1', title: 'Daily Task', status: ERecurringTaskStatus.ACTIVE, priority: EPriority.LOW, startDate: new Date(), intervals: [{ value: 1, unit: 'days' }], createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'rt-2', title: 'Weekly Task', status: ERecurringTaskStatus.ACTIVE, priority: EPriority.MEDIUM, startDate: new Date(), intervals: [{ value: 1, unit: 'weeks' }], createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'rt-3', title: 'Stopped Task', status: ERecurringTaskStatus.STOPPED, priority: EPriority.HIGH, startDate: new Date(), intervals: [{ value: 1, unit: 'months' }], createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const mockUnitOfWork = createMockUnitOfWork({ recurringTasks, taskRecurringLinks: [], tasks: [] });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getRecurringTaskStatistics();
      
      expect(result.activeTemplates).toBe(2);
    });
  });

  describe('getDependencyStatistics', () => {
    it('should return zero counts for empty dependencies', () => {
      const mockUnitOfWork = createMockUnitOfWork({ dependencies: [], tasks: [] });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getDependencyStatistics();
      
      expect(result.tasksWithDependencies).toBe(0);
      expect(result.blockedTasks).toBe(0);
      expect(result.hasCircularDependencies).toBe(false);
    });

    it('should detect blocked tasks', () => {
      const tasks: ITaskEntity[] = [
        { id: 'task-1', title: 'Task 1', status: EStatus.DONE, priority: EPriority.LOW, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'task-2', title: 'Task 2', status: EStatus.TODO, priority: EPriority.MEDIUM, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'task-3', title: 'Task 3', status: EStatus.TODO, priority: EPriority.HIGH, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const dependencies: ITaskDependencyEntity[] = [
        { id: 'dep-1', taskId: 'task-2', dependsOnTaskId: 'task-1', dependencyType: 'BLOCKS' as any, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'dep-2', taskId: 'task-3', dependsOnTaskId: 'task-2', dependencyType: 'BLOCKS' as any, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const mockUnitOfWork = createMockUnitOfWork({ tasks, dependencies, taskRecurringLinks: [] });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getDependencyStatistics();
      
      // task-2 depends on task-1 which is DONE - so task-2 is NOT blocked
      // task-3 depends on task-2 which is TODO - so task-3 IS blocked
      expect(result.blockedTasks).toBe(1);
    });

    it('should detect circular dependencies', () => {
      const tasks: ITaskEntity[] = [
        { id: 'task-1', title: 'Task 1', status: EStatus.TODO, priority: EPriority.LOW, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'task-2', title: 'Task 2', status: EStatus.TODO, priority: EPriority.MEDIUM, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const dependencies: ITaskDependencyEntity[] = [
        { id: 'dep-1', taskId: 'task-1', dependsOnTaskId: 'task-2', dependencyType: 'BLOCKS' as any, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'dep-2', taskId: 'task-2', dependsOnTaskId: 'task-1', dependencyType: 'BLOCKS' as any, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const mockUnitOfWork = createMockUnitOfWork({ tasks, dependencies, taskRecurringLinks: [] });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = statisticsService.getDependencyStatistics();
      
      expect(result.hasCircularDependencies).toBe(true);
    });
  });

  describe('getSummary', () => {
    it('should return all statistics at once', async () => {
      const tasks: ITaskEntity[] = [
        { id: '1', title: 'Task 1', status: EStatus.TODO, priority: EPriority.LOW, startDate: new Date(), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      
      const mockUnitOfWork = createMockUnitOfWork({ tasks, categories: [], assignments: [], recurringTasks: [], dependencies: [], taskRecurringLinks: [] });
      const statisticsService = new StatisticsService(mockUnitOfWork);
      
      const result = await statisticsService.getSummary();
      
      expect(result.taskStatus).toBeDefined();
      expect(result.taskPriority).toBeDefined();
      expect(result.taskTime).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(result.recurringTasks).toBeDefined();
      expect(result.dependencies).toBeDefined();
    });
  });
});
