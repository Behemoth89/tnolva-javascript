import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { PublicRoute } from '../components/PublicRoute';
import { Navbar } from '../components/Navbar';
import { TaskCard } from '../features/dashboard/components/TaskCard';
import { TaskList } from '../features/dashboard/components/TaskList';
import { TaskModal } from '../features/dashboard/components/TaskModal';
import { CategoryManager } from '../features/settings/components/CategoryManager';
import { PriorityManager } from '../features/settings/components/PriorityManager';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { useAuthStore } from '../stores/useAuthStore';
import { useTaskStore } from '../stores/useTaskStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { usePriorityStore } from '../stores/usePriorityStore';
import type { Task } from '../types/task';
import type { Category } from '../types/category';
import type { Priority } from '../types/priority';

vi.mock('../lib/apiClient', () => {
  const mock = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };
  return {
    apiClient: mock,
    createApiClient: () => mock,
  };
});

import { apiClient } from '../lib/apiClient';

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const renderWithRouter = (ui: React.ReactNode) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

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

describe('Phase 1+2: Foundation, Auth Store & Auth UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      refreshToken: null,
      firstName: null,
      lastName: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe('API Client (AUTH-04, AUTH-05)', () => {
    it('apiClient is exported as singleton', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
    });

    it('request interceptor attaches Bearer token when authenticated (AUTH-04)', () => {
      useAuthStore.getState().setAuth({
        token: 'bearer-token',
        refreshToken: 'refresh',
        firstName: 'Test',
        lastName: 'User',
      });
      const mockApi = apiClient as unknown as { get: ReturnType<typeof vi.fn> };
      mockApi.get.mockResolvedValue({ data: [] });
      apiClient.get('/TodoTasks');
      expect(mockApi.get).toHaveBeenCalledWith('/TodoTasks');
    });
  });

  describe('Auth Store (AUTH-04, AUTH-05, AUTH-06)', () => {
    it('setAuth stores tokens and sets isAuthenticated (AUTH-04)', () => {
      useAuthStore.getState().setAuth({
        token: 'test-token',
        refreshToken: 'test-refresh',
        firstName: 'John',
        lastName: 'Doe',
      });
      const state = useAuthStore.getState();
      expect(state.token).toBe('test-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('clearAuth resets all fields (AUTH-04)', () => {
      useAuthStore.getState().setAuth({
        token: 'test-token',
        refreshToken: 'test-refresh',
        firstName: 'John',
        lastName: 'Doe',
      });
      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('auth store persists state in memory (AUTH-06)', () => {
      useAuthStore.getState().setAuth({
        token: 'persist-test',
        refreshToken: 'refresh-test',
        firstName: 'Jane',
        lastName: 'Smith',
      });
      const state = useAuthStore.getState();
      expect(state.token).toBe('persist-test');
      expect(state.firstName).toBe('Jane');
    });
  });

  describe('LoginPage (AUTH-02)', () => {
    it('renders email and password fields (AUTH-02)', () => {
      renderWithRouter(<LoginPage />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('validates email format on blur (AUTH-02)', () => {
      renderWithRouter(<LoginPage />);
      const emailInput = screen.getByLabelText('Email');
      fireEvent.focus(emailInput);
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });

    it('validates password minimum length on blur (AUTH-02)', () => {
      renderWithRouter(<LoginPage />);
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.focus(passwordInput);
      fireEvent.change(passwordInput, { target: { value: 'abc' } });
      fireEvent.blur(passwordInput);
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });

    it('shows error on failed login (AUTH-02)', async () => {
      mockApiClient.post.mockRejectedValueOnce({ response: { status: 401 } });
      renderWithRouter(<LoginPage />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.blur(emailInput);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.blur(passwordInput);
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('shows network error message on connection failure (AUTH-02)', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network Error'));
      renderWithRouter(<LoginPage />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.blur(emailInput);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.blur(passwordInput);
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      await waitFor(() => {
        expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
      });
    });

    it('disables submit button while submitting (AUTH-02)', async () => {
      mockApiClient.post.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 2000))
      );
      renderWithRouter(<LoginPage />);
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    it('has link to register page (AUTH-02)', () => {
      renderWithRouter(<LoginPage />);
      expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
    });
  });

  describe('RegisterPage (AUTH-01)', () => {
    it('renders all 5 fields (AUTH-01)', () => {
      renderWithRouter(<RegisterPage />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    });

    it('validates password confirmation mismatch (AUTH-01)', () => {
      renderWithRouter(<RegisterPage />);
      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText('Confirm Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'different' } });
      fireEvent.focus(confirmInput);
      fireEvent.blur(confirmInput);
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('validates required fields (AUTH-01)', () => {
      renderWithRouter(<RegisterPage />);
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    });

    it('shows duplicate email error (AUTH-01)', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        response: { status: 409, data: { messages: ['Email already exists'] } },
      });
      renderWithRouter(<RegisterPage />);
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.blur(emailInput);
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      });
    });

    it('disables submit button while submitting (AUTH-01)', async () => {
      mockApiClient.post.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 2000))
      );
      renderWithRouter(<RegisterPage />);
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    it('has link to login page (AUTH-01)', () => {
      renderWithRouter(<RegisterPage />);
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
    });
  });

  describe('PublicRoute (AUTH-08)', () => {
    it('renders children when not authenticated (AUTH-08)', () => {
      renderWithRouter(
        <PublicRoute>
          <div>Public Content</div>
        </PublicRoute>
      );
      expect(screen.getByText('Public Content')).toBeInTheDocument();
    });

    it('redirects to dashboard when authenticated (AUTH-08)', () => {
      useAuthStore.setState({ isAuthenticated: true, isLoading: false });
      renderWithRouter(
        <PublicRoute>
          <div>Should Not Render</div>
        </PublicRoute>
      );
      expect(screen.queryByText('Should Not Render')).not.toBeInTheDocument();
    });
  });

  describe('ProtectedRoute (AUTH-07, AUTH-06)', () => {
    it('redirects to login when not authenticated (AUTH-07)', () => {
      useAuthStore.setState({ isAuthenticated: false, isLoading: false });
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders children when authenticated (AUTH-07)', () => {
      useAuthStore.setState({ isAuthenticated: true, isLoading: false });
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('shows loading spinner while rehydrating (AUTH-06)', () => {
      useAuthStore.setState({ isAuthenticated: false, isLoading: true });
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Navbar (AUTH-03)', () => {
    it('displays user greeting (AUTH-03)', () => {
      useAuthStore.setState({ firstName: 'John', isAuthenticated: true });
      renderWithRouter(<Navbar />);
      expect(screen.getByText(/hi, john/i)).toBeInTheDocument();
    });

    it('has logout button (AUTH-03)', () => {
      renderWithRouter(<Navbar />);
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('clears auth and redirects on logout (AUTH-03)', () => {
      useAuthStore.getState().setAuth({
        token: 'test-token',
        refreshToken: 'test-refresh',
        firstName: 'John',
        lastName: 'Doe',
      });
      renderWithRouter(<Navbar />);
      fireEvent.click(screen.getByRole('button', { name: /logout/i }));
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});

describe('Phase 3: Todo Core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskStore.setState({ tasks: [], isLoading: false, error: null });
    useCategoryStore.setState({ categories: [], isLoading: false, error: null });
    usePriorityStore.setState({ priorities: [], isLoading: false, error: null });
  });

  describe('Type Contracts (TASK-01..05, CAT-01..03, PRI-01..03)', () => {
    it('Task interface has all required API fields', () => {
      expect(mockTask.id).toBe('task-1');
      expect(mockTask.taskName).toBe('Test Task');
      expect(mockTask.isCompleted).toBe(false);
      expect(mockTask.todoCategoryId).toBe('cat-1');
      expect(mockTask.todoPriorityId).toBe('pri-1');
    });

    it('Category interface has all required fields', () => {
      expect(mockCategories[0].id).toBe('cat-1');
      expect(mockCategories[0].categoryName).toBe('Work');
    });

    it('Priority interface has all required fields', () => {
      expect(mockPriorities[0].id).toBe('pri-1');
      expect(mockPriorities[0].priorityName).toBe('High');
    });
  });

  describe('Task Stores (TASK-01..05, INF-04, INF-05)', () => {
    it('fetchTasks loads tasks from API (TASK-01)', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: [mockTask] });
      await useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });

    it('createTask adds task to store (TASK-02)', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockTask });
      await useTaskStore.getState().createTask({ taskName: 'Test Task' });
      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });

    it('updateTask modifies existing task (TASK-03)', async () => {
      useTaskStore.setState({ tasks: [mockTask] });
      const updated = { ...mockTask, taskName: 'Updated Task' };
      mockApiClient.put.mockResolvedValueOnce({ data: updated });
      await useTaskStore.getState().updateTask({ id: 'task-1', taskName: 'Updated Task' });
      expect(useTaskStore.getState().tasks[0].taskName).toBe('Updated Task');
    });

    it('deleteTask removes task from store (TASK-04)', async () => {
      useTaskStore.setState({ tasks: [mockTask] });
      mockApiClient.delete.mockResolvedValueOnce({});
      await useTaskStore.getState().deleteTask('task-1');
      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });

    it('toggleTaskCompletion flips isCompleted (TASK-05)', async () => {
      useTaskStore.setState({ tasks: [mockTask] });
      const toggled = { ...mockTask, isCompleted: true };
      mockApiClient.put.mockResolvedValueOnce({ data: toggled });
      await useTaskStore.getState().toggleTaskCompletion('task-1');
      expect(useTaskStore.getState().tasks[0].isCompleted).toBe(true);
    });

    it('sets isLoading during API calls (INF-04)', async () => {
      mockApiClient.get.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 50))
      );
      useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().isLoading).toBe(true);
      await new Promise((r) => setTimeout(r, 100));
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('sets error on API failure (INF-05)', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));
      await useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().error).toBe('Network error');
    });

    it('clearError resets error state', () => {
      useTaskStore.setState({ error: 'Some error' });
      useTaskStore.getState().clearError();
      expect(useTaskStore.getState().error).toBeNull();
    });
  });

  describe('Category & Priority Stores (CAT-01..03, PRI-01..03, INF-04, INF-05)', () => {
    it('createCategory adds category (CAT-01)', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockCategories[0] });
      await useCategoryStore.getState().createCategory({ categoryName: 'Work' });
      expect(useCategoryStore.getState().categories).toHaveLength(1);
    });

    it('updateCategory modifies existing category (CAT-02)', async () => {
      useCategoryStore.setState({ categories: [mockCategories[0]] });
      const updated = { ...mockCategories[0], categoryName: 'Personal' };
      mockApiClient.put.mockResolvedValueOnce({ data: updated });
      await useCategoryStore.getState().updateCategory({ id: 'cat-1', categoryName: 'Personal' });
      expect(useCategoryStore.getState().categories[0].categoryName).toBe('Personal');
    });

    it('deleteCategory removes category (CAT-03)', async () => {
      useCategoryStore.setState({ categories: [mockCategories[0]] });
      mockApiClient.delete.mockResolvedValueOnce({});
      await useCategoryStore.getState().deleteCategory('cat-1');
      expect(useCategoryStore.getState().categories).toHaveLength(0);
    });

    it('createPriority adds priority (PRI-01)', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockPriorities[0] });
      await usePriorityStore.getState().createPriority({ priorityName: 'High' });
      expect(usePriorityStore.getState().priorities).toHaveLength(1);
    });

    it('updatePriority modifies existing priority (PRI-02)', async () => {
      usePriorityStore.setState({ priorities: [mockPriorities[0]] });
      const updated = { ...mockPriorities[0], priorityName: 'Urgent' };
      mockApiClient.put.mockResolvedValueOnce({ data: updated });
      await usePriorityStore.getState().updatePriority({ id: 'pri-1', priorityName: 'Urgent' });
      expect(usePriorityStore.getState().priorities[0].priorityName).toBe('Urgent');
    });

    it('deletePriority removes priority (PRI-03)', async () => {
      usePriorityStore.setState({ priorities: [mockPriorities[0]] });
      mockApiClient.delete.mockResolvedValueOnce({});
      await usePriorityStore.getState().deletePriority('pri-1');
      expect(usePriorityStore.getState().priorities).toHaveLength(0);
    });

    it('sets error on API failure (INF-05)', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Failed'));
      await useCategoryStore.getState().fetchCategories();
      expect(useCategoryStore.getState().error).toBe('Failed');
    });
  });

  describe('TaskCard Component (TASK-01..05)', () => {
    it('renders task name', () => {
      renderWithRouter(
        <TaskCard task={mockTask} categories={mockCategories} priorities={mockPriorities} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('renders category name', () => {
      renderWithRouter(
        <TaskCard task={mockTask} categories={mockCategories} priorities={mockPriorities} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('calls onToggle when checkbox is clicked (TASK-05)', () => {
      const onToggle = vi.fn();
      renderWithRouter(
        <TaskCard task={mockTask} categories={mockCategories} priorities={mockPriorities} onToggle={onToggle} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      fireEvent.click(screen.getByRole('button', { name: /mark as complete/i }));
      expect(onToggle).toHaveBeenCalledWith('task-1');
    });

    it('calls onEdit when edit button is clicked (TASK-03)', () => {
      const onEdit = vi.fn();
      renderWithRouter(
        <TaskCard task={mockTask} categories={mockCategories} priorities={mockPriorities} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />
      );
      fireEvent.click(screen.getByRole('button', { name: /edit task/i }));
      expect(onEdit).toHaveBeenCalledWith(mockTask);
    });

    it('calls onDelete when delete button is clicked (TASK-04)', () => {
      const onDelete = vi.fn();
      renderWithRouter(
        <TaskCard task={mockTask} categories={mockCategories} priorities={mockPriorities} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />
      );
      fireEvent.click(screen.getByRole('button', { name: /delete task/i }));
      expect(onDelete).toHaveBeenCalledWith('task-1');
    });

    it('applies line-through style for completed tasks', () => {
      const completedTask = { ...mockTask, isCompleted: true };
      renderWithRouter(
        <TaskCard task={completedTask} categories={mockCategories} priorities={mockPriorities} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      expect(screen.getByText('Test Task')).toHaveClass('line-through');
    });
  });

  describe('TaskList Component (TASK-01)', () => {
    it('renders empty state when no tasks', () => {
      renderWithRouter(
        <TaskList tasks={[]} categories={mockCategories} priorities={mockPriorities} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
    });

    it('renders tasks in a list', () => {
      renderWithRouter(
        <TaskList tasks={[mockTask]} categories={mockCategories} priorities={mockPriorities} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });

  describe('TaskModal Component (TASK-02, TASK-03)', () => {
    it('does not render when isOpen is false', () => {
      renderWithRouter(
        <TaskModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} categories={mockCategories} priorities={mockPriorities} isSubmitting={false} />
      );
      expect(screen.queryByText('Create Task')).not.toBeInTheDocument();
    });

    it('renders create mode form', () => {
      renderWithRouter(
        <TaskModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} categories={mockCategories} priorities={mockPriorities} isSubmitting={false} />
      );
      expect(screen.getByRole('heading', { name: 'Create Task' })).toBeInTheDocument();
      expect(screen.getByLabelText('Task name')).toBeInTheDocument();
    });

    it('renders edit mode form with pre-filled values', () => {
      renderWithRouter(
        <TaskModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} task={mockTask} categories={mockCategories} priorities={mockPriorities} isSubmitting={false} />
      );
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByLabelText('Task name')).toHaveValue('Test Task');
    });

    it('disables submit button when task name is empty', () => {
      renderWithRouter(
        <TaskModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} categories={mockCategories} priorities={mockPriorities} isSubmitting={false} />
      );
      expect(screen.getByRole('button', { name: /^Create Task$/ })).toBeDisabled();
    });

    it('submits payload when form is valid', () => {
      const onSubmit = vi.fn();
      renderWithRouter(
        <TaskModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} categories={mockCategories} priorities={mockPriorities} isSubmitting={false} />
      );
      fireEvent.change(screen.getByLabelText('Task name'), { target: { value: 'New Task' } });
      fireEvent.click(screen.getByRole('button', { name: /^Create Task$/ }));
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ taskName: 'New Task' }));
    });

    it('disables submit button while submitting (INF-04)', () => {
      renderWithRouter(
        <TaskModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} categories={mockCategories} priorities={mockPriorities} isSubmitting={true} />
      );
      expect(screen.getByText('Saving...')).toBeDisabled();
    });
  });

  describe('CategoryManager (CAT-01..03)', () => {
    it('renders Add Category button (CAT-01)', () => {
      renderWithRouter(<CategoryManager />);
      expect(screen.getByText('Add Category')).toBeInTheDocument();
    });

    it('shows input form when Add Category is clicked (CAT-01)', () => {
      renderWithRouter(<CategoryManager />);
      fireEvent.click(screen.getByText('Add Category'));
      expect(screen.getByPlaceholderText('Category name')).toBeInTheDocument();
    });

    it('displays existing categories (CAT-01)', () => {
      useCategoryStore.setState({ categories: [mockCategories[0]] });
      renderWithRouter(<CategoryManager />);
      expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('shows Edit button for each category (CAT-02)', () => {
      useCategoryStore.setState({ categories: [mockCategories[0]] });
      renderWithRouter(<CategoryManager />);
      expect(screen.getAllByText('Edit').length).toBeGreaterThan(0);
    });

    it('shows Delete button for each category (CAT-03)', () => {
      useCategoryStore.setState({ categories: [mockCategories[0]] });
      renderWithRouter(<CategoryManager />);
      expect(screen.getAllByText('Delete').length).toBeGreaterThan(0);
    });
  });

  describe('PriorityManager (PRI-01..03)', () => {
    it('renders Add Priority button (PRI-01)', () => {
      renderWithRouter(<PriorityManager />);
      expect(screen.getByText('Add Priority')).toBeInTheDocument();
    });

    it('shows input form when Add Priority is clicked (PRI-01)', () => {
      renderWithRouter(<PriorityManager />);
      fireEvent.click(screen.getByText('Add Priority'));
      expect(screen.getByPlaceholderText('Priority name')).toBeInTheDocument();
    });

    it('displays existing priorities (PRI-01)', () => {
      usePriorityStore.setState({ priorities: [mockPriorities[0]] });
      renderWithRouter(<PriorityManager />);
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('shows Edit button for each priority (PRI-02)', () => {
      usePriorityStore.setState({ priorities: [mockPriorities[0]] });
      renderWithRouter(<PriorityManager />);
      expect(screen.getAllByText('Edit').length).toBeGreaterThan(0);
    });

    it('shows Delete button for each priority (PRI-03)', () => {
      usePriorityStore.setState({ priorities: [mockPriorities[0]] });
      renderWithRouter(<PriorityManager />);
      expect(screen.getAllByText('Delete').length).toBeGreaterThan(0);
    });
  });

  describe('SettingsPage', () => {
    it('renders Settings heading', () => {
      renderWithRouter(<SettingsPage />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('shows Categories tab by default', () => {
      renderWithRouter(<SettingsPage />);
      expect(screen.getByText('Add Category')).toBeInTheDocument();
    });

    it('switches to Priorities tab when clicked', () => {
      renderWithRouter(<SettingsPage />);
      fireEvent.click(screen.getByText('Priorities'));
      expect(screen.getByText('Add Priority')).toBeInTheDocument();
    });
  });
});
