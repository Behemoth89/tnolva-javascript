/**
 * Unit Tests for Task Entity
 * Tests for Task entity creation, status transitions, and tag operations
 */
import { describe, it, expect } from 'vitest';
import { Task } from '../domain/Task.js';
import { EStatus } from '../enums/EStatus.js';
import { EPriority } from '../enums/EPriority.js';

describe('Task Entity Creation', () => {
  it('should create a task with all properties', () => {
    const task = new Task({
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      status: EStatus.TODO,
      priority: EPriority.HIGH,
      dueDate: new Date('2024-12-31'),
      tags: ['tag1', 'tag2'],
    });

    expect(task.id).toBe('1');
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Test Description');
    expect(task.status).toBe(EStatus.TODO);
    expect(task.priority).toBe(EPriority.HIGH);
    expect(task.dueDate).toBeInstanceOf(Date);
    expect(task.tags).toEqual(['tag1', 'tag2']);
  });

  it('should create a task with required fields only', () => {
    const task = new Task({
      id: '2',
      title: 'Minimal Task',
    });

    expect(task.id).toBe('2');
    expect(task.title).toBe('Minimal Task');
    expect(task.status).toBe(EStatus.TODO);
    expect(task.priority).toBe(EPriority.MEDIUM);
    expect(task.tags).toEqual([]);
  });

  it('should throw error when id is missing', () => {
    expect(() => new Task({ id: '', title: 'Test' })).toThrow('Task id is required');
  });

  it('should throw error when title is missing', () => {
    expect(() => new Task({ id: '1', title: '' })).toThrow('Task title is required');
  });

  it('should trim whitespace from title and description', () => {
    const task = new Task({
      id: '1',
      title: '  Test Title  ',
      description: '  Test Description  ',
    });

    expect(task.title).toBe('Test Title');
    expect(task.description).toBe('Test Description');
  });
});

describe('Task Status Transitions', () => {
  it('should transition from TODO to IN_PROGRESS', () => {
    const task = new Task({ id: '1', title: 'Test' });
    expect(task.status).toBe(EStatus.TODO);

    task.start();
    expect(task.status).toBe(EStatus.IN_PROGRESS);
  });

  it('should transition from IN_PROGRESS to DONE', () => {
    const task = new Task({ id: '1', title: 'Test', status: EStatus.IN_PROGRESS });

    task.complete();
    expect(task.status).toBe(EStatus.DONE);
  });

  it('should transition to CANCELLED from any status', () => {
    const todoTask = new Task({ id: '1', title: 'Test' });
    todoTask.cancel();
    expect(todoTask.status).toBe(EStatus.CANCELLED);

    const inProgressTask = new Task({ id: '2', title: 'Test', status: EStatus.IN_PROGRESS });
    inProgressTask.cancel();
    expect(inProgressTask.status).toBe(EStatus.CANCELLED);

    const doneTask = new Task({ id: '3', title: 'Test', status: EStatus.DONE });
    doneTask.cancel();
    expect(doneTask.status).toBe(EStatus.CANCELLED);
  });

  it('should not transition to IN_PROGRESS if not in TODO', () => {
    const task = new Task({ id: '1', title: 'Test', status: EStatus.DONE });
    task.start();
    expect(task.status).toBe(EStatus.DONE);
  });
});

describe('Task Tag Operations', () => {
  it('should add a tag', () => {
    const task = new Task({ id: '1', title: 'Test' });
    task.addTag('new-tag');
    expect(task.tags).toContain('new-tag');
  });

  it('should not add duplicate tags', () => {
    const task = new Task({ id: '1', title: 'Test', tags: ['existing'] });
    task.addTag('existing');
    expect(task.tags).toHaveLength(1);
  });

  it('should remove a tag', () => {
    const task = new Task({ id: '1', title: 'Test', tags: ['tag1', 'tag2'] });
    task.removeTag('tag1');
    expect(task.tags).not.toContain('tag1');
    expect(task.tags).toContain('tag2');
  });

  it('should check if task has a tag', () => {
    const task = new Task({ id: '1', title: 'Test', tags: ['tag1', 'tag2'] });
    expect(task.hasTag('tag1')).toBe(true);
    expect(task.hasTag('tag3')).toBe(false);
  });

  it('should trim whitespace from tags', () => {
    const task = new Task({ id: '1', title: 'Test' });
    task.addTag('  trimmed-tag  ');
    expect(task.hasTag('trimmed-tag')).toBe(true);
  });
});

describe('Task Priority Changes', () => {
  it('should change priority', () => {
    const task = new Task({ id: '1', title: 'Test', priority: EPriority.LOW });
    task.changePriority(EPriority.URGENT);
    expect(task.priority).toBe(EPriority.URGENT);
  });
});

describe('Task Update', () => {
  it('should update task with partial data', () => {
    const task = new Task({ id: '1', title: 'Original' });
    task.update({ title: 'Updated' });
    expect(task.title).toBe('Updated');
  });

  it('should update multiple fields', () => {
    const task = new Task({ id: '1', title: 'Original', priority: EPriority.LOW });
    task.update({ title: 'Updated', priority: EPriority.HIGH, status: EStatus.IN_PROGRESS });
    expect(task.title).toBe('Updated');
    expect(task.priority).toBe(EPriority.HIGH);
    expect(task.status).toBe(EStatus.IN_PROGRESS);
  });

  it('should throw error when updating with empty title', () => {
    const task = new Task({ id: '1', title: 'Original' });
    expect(() => task.update({ title: '' })).toThrow('Task title cannot be empty');
  });
});

describe('Task toObject', () => {
  it('should convert to plain object', () => {
    const task = new Task({
      id: '1',
      title: 'Test',
      description: 'Desc',
      status: EStatus.TODO,
      priority: EPriority.HIGH,
      tags: ['tag1'],
    });

    const obj = task.toObject();
    expect(obj).toEqual({
      id: '1',
      title: 'Test',
      description: 'Desc',
      status: EStatus.TODO,
      priority: EPriority.HIGH,
      dueDate: undefined,
      tags: ['tag1'],
    });
  });
});
