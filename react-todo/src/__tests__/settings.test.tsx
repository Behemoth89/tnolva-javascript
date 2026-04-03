import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { CategoryManager } from '../features/settings/components/CategoryManager';
import { PriorityManager } from '../features/settings/components/PriorityManager';
import { useCategoryStore } from '../stores/useCategoryStore';
import { usePriorityStore } from '../stores/usePriorityStore';
import type { Category } from '../types/category';
import type { Priority } from '../types/priority';

vi.mock('../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../components/Navbar', () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

const mockCategory: Category = {
  id: 'cat-1',
  categoryName: 'Work',
  categorySort: 0,
  syncDt: null,
  tag: null,
};

const mockPriority: Priority = {
  id: 'pri-1',
  priorityName: 'High',
  prioritySort: 0,
  syncDt: null,
  tag: null,
};

describe('CategoryManager (CAT-01..03)', () => {
  beforeEach(() => {
    useCategoryStore.setState({
      categories: [],
      isLoading: false,
      error: null,
    });
  });

  it('renders Add Category button (CAT-01)', () => {
    render(<CategoryManager />);
    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });

  it('shows input form when Add Category is clicked (CAT-01)', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByText('Add Category'));
    expect(screen.getByPlaceholderText('Category name')).toBeInTheDocument();
  });

  it('displays existing categories (CAT-01)', () => {
    useCategoryStore.setState({ categories: [mockCategory] });
    render(<CategoryManager />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('shows Edit button for each category (CAT-02)', () => {
    useCategoryStore.setState({ categories: [mockCategory] });
    render(<CategoryManager />);
    expect(screen.getAllByText('Edit').length).toBeGreaterThan(0);
  });

  it('shows Delete button for each category (CAT-03)', () => {
    useCategoryStore.setState({ categories: [mockCategory] });
    render(<CategoryManager />);
    expect(screen.getAllByText('Delete').length).toBeGreaterThan(0);
  });

  it('shows empty list when no categories exist', async () => {
    useCategoryStore.setState({
      categories: [],
      isLoading: false,
      error: null,
    });
    const { rerender } = render(<CategoryManager />);
    rerender(<CategoryManager />);
    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });
});

describe('PriorityManager (PRI-01..03)', () => {
  beforeEach(() => {
    usePriorityStore.setState({
      priorities: [],
      isLoading: false,
      error: null,
    });
  });

  it('renders Add Priority button (PRI-01)', () => {
    render(<PriorityManager />);
    expect(screen.getByText('Add Priority')).toBeInTheDocument();
  });

  it('shows input form when Add Priority is clicked (PRI-01)', () => {
    render(<PriorityManager />);
    fireEvent.click(screen.getByText('Add Priority'));
    expect(screen.getByPlaceholderText('Priority name')).toBeInTheDocument();
  });

  it('displays existing priorities (PRI-01)', () => {
    usePriorityStore.setState({ priorities: [mockPriority] });
    render(<PriorityManager />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('shows Edit button for each priority (PRI-02)', () => {
    usePriorityStore.setState({ priorities: [mockPriority] });
    render(<PriorityManager />);
    expect(screen.getAllByText('Edit').length).toBeGreaterThan(0);
  });

  it('shows Delete button for each priority (PRI-03)', () => {
    usePriorityStore.setState({ priorities: [mockPriority] });
    render(<PriorityManager />);
    expect(screen.getAllByText('Delete').length).toBeGreaterThan(0);
  });

  it('shows empty list when no priorities exist', async () => {
    usePriorityStore.setState({
      priorities: [],
      isLoading: false,
      error: null,
    });
    const { rerender } = render(<PriorityManager />);
    rerender(<PriorityManager />);
    expect(screen.getByText('Add Priority')).toBeInTheDocument();
  });
});

describe('SettingsPage', () => {
  beforeEach(() => {
    useCategoryStore.setState({
      categories: [],
      isLoading: false,
      error: null,
    });
    usePriorityStore.setState({
      priorities: [],
      isLoading: false,
      error: null,
    });
  });

  it('renders Settings heading', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows Categories tab by default', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });

  it('switches to Priorities tab when clicked', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Priorities'));
    expect(screen.getByText('Add Priority')).toBeInTheDocument();
  });

  it('switches back to Categories tab when clicked', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Priorities'));
    fireEvent.click(screen.getByText('Categories'));
    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });
});
