import type { Task, CreateTaskPayload, UpdateTaskPayload } from '../types/task';
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '../types/category';
import type { Priority, CreatePriorityPayload, UpdatePriorityPayload } from '../types/priority';

describe('Type Contracts', () => {
  describe('Task types (TASK-01..05)', () => {
    it('Task interface has all required API fields', () => {
      const task: Task = {
        id: 'uuid-1',
        taskName: 'Test task',
        taskSort: 0,
        createdDt: '2026-04-03T00:00:00Z',
        dueDt: null,
        isCompleted: false,
        isArchived: false,
        todoCategoryId: 'cat-1',
        todoPriorityId: 'pri-1',
        syncDt: '2026-04-03T00:00:00Z',
      };
      expect(task.id).toBe('uuid-1');
      expect(task.taskName).toBe('Test task');
      expect(task.isCompleted).toBe(false);
      expect(task.todoCategoryId).toBe('cat-1');
      expect(task.todoPriorityId).toBe('pri-1');
    });

    it('Task allows nullable taskName', () => {
      const task: Task = {
        id: 'uuid-2',
        taskName: null,
        taskSort: 0,
        createdDt: '2026-04-03T00:00:00Z',
        dueDt: null,
        isCompleted: false,
        isArchived: false,
        todoCategoryId: 'cat-1',
        todoPriorityId: 'pri-1',
        syncDt: '2026-04-03T00:00:00Z',
      };
      expect(task.taskName).toBeNull();
    });

    it('Task allows nullable dueDt', () => {
      const task: Task = {
        id: 'uuid-3',
        taskName: 'No due date',
        taskSort: 0,
        createdDt: '2026-04-03T00:00:00Z',
        dueDt: null,
        isCompleted: false,
        isArchived: false,
        todoCategoryId: 'cat-1',
        todoPriorityId: 'pri-1',
        syncDt: '2026-04-03T00:00:00Z',
      };
      expect(task.dueDt).toBeNull();
    });

    it('CreateTaskPayload requires taskName', () => {
      const payload: CreateTaskPayload = {
        taskName: 'New task',
        dueDt: '2026-05-01',
        todoCategoryId: 'cat-1',
        todoPriorityId: 'pri-1',
      };
      expect(payload.taskName).toBe('New task');
    });

    it('CreateTaskPayload allows optional fields', () => {
      const payload: CreateTaskPayload = {
        taskName: 'Minimal task',
      };
      expect(payload.dueDt).toBeUndefined();
      expect(payload.todoCategoryId).toBeUndefined();
    });

    it('UpdateTaskPayload requires id', () => {
      const payload: UpdateTaskPayload = {
        id: 'uuid-1',
        taskName: 'Updated name',
      };
      expect(payload.id).toBe('uuid-1');
    });
  });

  describe('Category types (CAT-01..03)', () => {
    it('Category interface has all required API fields', () => {
      const category: Category = {
        id: 'cat-1',
        categoryName: 'Work',
        categorySort: 0,
        syncDt: null,
        tag: null,
      };
      expect(category.id).toBe('cat-1');
      expect(category.categoryName).toBe('Work');
      expect(category.categorySort).toBe(0);
    });

    it('CreateCategoryPayload requires categoryName', () => {
      const payload: CreateCategoryPayload = {
        categoryName: 'Personal',
      };
      expect(payload.categoryName).toBe('Personal');
    });

    it('UpdateCategoryPayload requires id', () => {
      const payload: UpdateCategoryPayload = {
        id: 'cat-1',
        categoryName: 'Updated',
      };
      expect(payload.id).toBe('cat-1');
    });
  });

  describe('Priority types (PRI-01..03)', () => {
    it('Priority interface has all required API fields', () => {
      const priority: Priority = {
        id: 'pri-1',
        priorityName: 'High',
        prioritySort: 0,
        syncDt: null,
        tag: null,
      };
      expect(priority.id).toBe('pri-1');
      expect(priority.priorityName).toBe('High');
      expect(priority.prioritySort).toBe(0);
    });

    it('CreatePriorityPayload requires priorityName', () => {
      const payload: CreatePriorityPayload = {
        priorityName: 'Urgent',
        prioritySort: 1,
      };
      expect(payload.priorityName).toBe('Urgent');
    });

    it('UpdatePriorityPayload requires id', () => {
      const payload: UpdatePriorityPayload = {
        id: 'pri-1',
        priorityName: 'Updated',
      };
      expect(payload.id).toBe('pri-1');
    });
  });
});
