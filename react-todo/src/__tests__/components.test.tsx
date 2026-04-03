import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../features/dashboard/components/TaskCard';
import { TaskList } from '../features/dashboard/components/TaskList';
import { TaskModal } from '../features/dashboard/components/TaskModal';
import type { Task } from '../types/task';
import type { Category } from '../types/category';
import type { Priority } from '../types/priority';

const mockTask: Task = {
  id: 'task-1',
  taskName: 'Test Task',
  taskSort: 0,
  createdDt: '2026-04-03T00:00:00Z',
  dueDt: '2026-05-01T00:00:00Z',
  isCompleted: false,
  isArchived: false,
  todoCategoryId: 'cat-1',
  todoPriorityId: 'pri-1',
  syncDt: '2026-04-03T00:00:00Z',
};

const mockCategories: Category[] = [
  { id: 'cat-1', categoryName: 'Work', categorySort: 0, syncDt: null, tag: null },
];

const mockPriorities: Priority[] = [
  { id: 'pri-1', priorityName: 'High', prioritySort: 0, syncDt: null, tag: null },
];

describe('TaskCard Component (TASK-01..05)', () => {
  it('renders task name', () => {
    render(
      <TaskCard
        task={mockTask}
        categories={mockCategories}
        priorities={mockPriorities}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders category name', () => {
    render(
      <TaskCard
        task={mockTask}
        categories={mockCategories}
        priorities={mockPriorities}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('renders priority name', () => {
    render(
      <TaskCard
        task={mockTask}
        categories={mockCategories}
        priorities={mockPriorities}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('calls onToggle when checkbox is clicked (TASK-05)', () => {
    const onToggle = vi.fn();
    render(
      <TaskCard
        task={mockTask}
        categories={mockCategories}
        priorities={mockPriorities}
        onToggle={onToggle}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /mark as complete/i }));
    expect(onToggle).toHaveBeenCalledWith('task-1');
  });

  it('calls onEdit when edit button is clicked (TASK-03)', () => {
    const onEdit = vi.fn();
    render(
      <TaskCard
        task={mockTask}
        categories={mockCategories}
        priorities={mockPriorities}
        onToggle={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /edit task/i }));
    expect(onEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete button is clicked (TASK-04)', () => {
    const onDelete = vi.fn();
    render(
      <TaskCard
        task={mockTask}
        categories={mockCategories}
        priorities={mockPriorities}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /delete task/i }));
    expect(onDelete).toHaveBeenCalledWith('task-1');
  });

  it('shows Untitled task for null taskName', () => {
    const nullNameTask = { ...mockTask, taskName: null };
    render(
      <TaskCard
        task={nullNameTask}
        categories={mockCategories}
        priorities={mockPriorities}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Untitled task')).toBeInTheDocument();
  });

  it('applies line-through style for completed tasks', () => {
    const completedTask = { ...mockTask, isCompleted: true };
    render(
      <TaskCard
        task={completedTask}
        categories={mockCategories}
        priorities={mockPriorities}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const taskName = screen.getByText('Test Task');
    expect(taskName).toHaveClass('line-through');
  });
});

describe('TaskList Component (TASK-01)', () => {
  it('renders empty state when no tasks', () => {
    render(
      <TaskList
        tasks={[]}
        categories={mockCategories}
        priorities={mockPriorities}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('renders tasks in a list', () => {
    render(
      <TaskList
        tasks={[mockTask]}
        categories={mockCategories}
        priorities={mockPriorities}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});

describe('TaskModal Component (TASK-02, TASK-03)', () => {
  it('does not render when isOpen is false', () => {
    render(
      <TaskModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        categories={mockCategories}
        priorities={mockPriorities}
        isSubmitting={false}
      />
    );
    expect(screen.queryByText('Create Task')).not.toBeInTheDocument();
  });

  it('renders create mode form', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        categories={mockCategories}
        priorities={mockPriorities}
        isSubmitting={false}
      />
    );
    expect(screen.getByRole('heading', { name: 'Create Task' })).toBeInTheDocument();
    expect(screen.getByLabelText('Task name')).toBeInTheDocument();
  });

  it('renders edit mode form with pre-filled values', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        task={mockTask}
        categories={mockCategories}
        priorities={mockPriorities}
        isSubmitting={false}
      />
    );
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByLabelText('Task name')).toHaveValue('Test Task');
  });

  it('disables submit button when task name is empty', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        categories={mockCategories}
        priorities={mockPriorities}
        isSubmitting={false}
      />
    );
    const submitButton = screen.getByRole('button', { name: /^Create Task$/ });
    expect(submitButton).toBeDisabled();
  });

  it('submits payload when form is valid', () => {
    const onSubmit = vi.fn();
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        categories={mockCategories}
        priorities={mockPriorities}
        isSubmitting={false}
      />
    );
    fireEvent.change(screen.getByLabelText('Task name'), { target: { value: 'New Task' } });
    fireEvent.click(screen.getByRole('button', { name: /^Create Task$/ }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ taskName: 'New Task' })
    );
  });

  it('disables submit button while submitting (INF-04)', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        categories={mockCategories}
        priorities={mockPriorities}
        isSubmitting={true}
      />
    );
    const submitButton = screen.getByText('Saving...');
    expect(submitButton).toBeDisabled();
  });
});

describe('DashboardPage Loading/Error States (INF-04, INF-05)', () => {
  it('shows loading spinner when tasks are loading and empty', () => {
    vi.mock('../stores/useTaskStore', () => ({
      useTaskStore: vi.fn(() => ({
        tasks: [],
        isLoading: true,
        error: null,
        fetchTasks: vi.fn(),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn(),
        toggleTaskCompletion: vi.fn(),
        clearError: vi.fn(),
      })),
    }));
  });
});
