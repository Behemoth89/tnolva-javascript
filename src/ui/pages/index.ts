/**
 * Index Page - Main Tasks Index with Task Table
 * Displays a sortable, filterable table of all tasks
 */

import { UiBridge, EStatus, EPriority } from '../services/ui-bridge.js';
import type { IBllTaskDto, IBllCategoryDto } from '../../bll/interfaces/dtos/index.js';
import { TableSorter, getSortHeaderHtml } from '../../utils/sorting.js';
import { FilterController, filterItems, createSearchableDropdown } from '../../utils/filter.js';

const bridge = new UiBridge();

// Sort state management
let taskSorter: TableSorter<IBllTaskDto> | null = null;
let allTasks: IBllTaskDto[] = [];
let filterController: FilterController;

// Column filter values
const columnFilters: Record<string, string> = {};

// Date range filter state
let dateRangeFilter: { startDate: string | null; endDate: string | null } = {
  startDate: null,
  endDate: null,
};

/**
 * Preset date range options
 */
export type DatePreset = 'today' | 'this-week' | 'next-week' | 'this-month' | 'next-month' | 'this-year' | 'clear';

/**
 * Calculate preset date range
 */
function calculatePresetRange(preset: DatePreset): { startDate: string | null; endDate: string | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today': {
      // Start = today 00:00, End = today 23:59
      const start = new Date(today);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    
    case 'this-week': {
      // Start = Monday of current week, End = Sunday of current week
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      return { startDate: monday.toISOString(), endDate: sunday.toISOString() };
    }
    
    case 'next-week': {
      // Start = Monday of next week, End = Sunday of next week
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() + (dayOfWeek === 0 ? 1 : 8 - dayOfWeek));
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      return { startDate: monday.toISOString(), endDate: sunday.toISOString() };
    }
    
    case 'this-month': {
      // Start = 1st of current month, End = last day of current month
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    
    case 'next-month': {
      // Start = 1st of next month, End = last day of next month
      const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      end.setHours(23, 59, 59, 999);
      
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    
    case 'this-year': {
      // Start = January 1st of current year, End = December 31st of current year
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    
    case 'clear':
    default:
      return { startDate: null, endDate: null };
  }
}

/**
 * Handle preset selection
 */
function handlePresetChange(preset: DatePreset): void {
  const range = calculatePresetRange(preset);
  dateRangeFilter = range;
  
  // Update date inputs
  const startInput = document.getElementById('filter-date-start') as HTMLInputElement;
  const endInput = document.getElementById('filter-date-end') as HTMLInputElement;
  
  if (startInput && endInput) {
    if (range.startDate) {
      startInput.value = formatDateForInput(range.startDate);
    } else {
      startInput.value = '';
    }
    
    if (range.endDate) {
      endInput.value = formatDateForInput(range.endDate);
    } else {
      endInput.value = '';
    }
  }
  
  // Apply date filter
  applyFiltersAndRender();
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
function formatDateForInput(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Global preset handler - must be on window for inline onclick
 */
function handleIndexPreset(preset: string): void {
  handlePresetChange(preset as DatePreset);
}

// Expose to window for inline onclick handlers
(window as unknown as { handleIndexPreset: typeof handleIndexPreset }).handleIndexPreset = handleIndexPreset;

/**
 * Global sort handler - must be on window for inline onclick
 */
function handleIndexSort(key: string): void {
  if (taskSorter) {
    const sorted = taskSorter.sort(key as keyof IBllTaskDto);
    const filtered = applyAllColumnFilters(sorted);
    renderTasksTable(filtered);
  }
}

// Expose to window for inline onclick handlers
(window as unknown as { handleIndexSort: typeof handleIndexSort }).handleIndexSort = handleIndexSort;

/**
 * Render index page with task table
 */
export async function renderIndexPage(): Promise<void> {
  const appElement = document.getElementById('app');
  if (!appElement) return;

  // Render layout with sidebar
  appElement.innerHTML = `
    <div class="settings-layout">
      <div id="sidebar-container"></div>
      <main class="settings-content" id="index-content">
        <div class="index-page">
          <div class="index-header">
            <h1 class="page-title">Tasks</h1>
            <button class="btn btn-primary" id="add-task-btn">Add Task</button>
          </div>
          <div id="index-filters"></div>
          <div id="task-statistics-panel"></div>
          <div id="tasks-table-container">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </main>
    </div>
    <div class="toast-container" id="toast-container"></div>
  `;

  // Add button click handler
  document.getElementById('add-task-btn')?.addEventListener('click', () => showAddTaskModal());

  // Import and render sidebar
  const { renderSidebar, initSidebar } = await import('../components/sidebar.js');
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = renderSidebar('/');
    initSidebar();
  }

  // Initialize filter controller
  filterController = new FilterController();

  // Load tasks
  await loadTasks();
}

/**
 * Load tasks into table
 */
async function loadTasks(): Promise<void> {
  const container = document.getElementById('tasks-table-container');
  if (!container) return;

  try {
    allTasks = await bridge.getAllTasks();

    // Initialize sorter
    taskSorter = new TableSorter<IBllTaskDto>(allTasks);

    // Render filter inputs
    renderFilterInputs();

    // Render statistics panel
    renderStatisticsPanel();

    if (allTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">No tasks yet</div>
          <div class="empty-state-description">Create your first task to get started</div>
        </div>
      `;
      // Update statistics for empty state
      updateStatistics([]);
      return;
    }

    // Apply initial sorting (by due date ascending as default)
    const sorted = taskSorter.sort('dueDate');
    updateStatistics(sorted);
    renderTasksTable(sorted);
  } catch (error) {
    console.error('Error loading tasks:', error);
    container.innerHTML = `<div class="text-danger">Error loading tasks</div>`;
  }
}

/**
 * Render filter inputs for each column
 */
function renderFilterInputs(): void {
  const filtersContainer = document.getElementById('index-filters');
  if (!filtersContainer) return;

  filtersContainer.innerHTML = `
    <div class="table-filters">
      <div class="filter-row">
        <input type="text" class="filter-input" id="filter-title" placeholder="Filter by title..." data-column="title">
        <input type="text" class="filter-input" id="filter-status" placeholder="Filter by status..." data-column="status">
        <input type="text" class="filter-input" id="filter-priority" placeholder="Filter by priority..." data-column="priority">
        <input type="text" class="filter-input" id="filter-category" placeholder="Filter by category..." data-column="categoryName">
        <input type="text" class="filter-input" id="filter-tags" placeholder="Filter by tags..." data-column="tags">
        <input type="text" class="filter-input" id="filter-description" placeholder="Filter by description..." data-column="description">
      </div>
      <div class="filter-row date-filter-row">
        <div class="date-range-filter">
          <label class="filter-label">Date Range:</label>
          <select class="filter-select" id="filter-preset" onchange="handleIndexPreset(this.value)">
            <option value="">Select preset...</option>
            <option value="today">Today</option>
            <option value="this-week">This week</option>
            <option value="next-week">Next week</option>
            <option value="this-month">This month</option>
            <option value="next-month">Next month</option>
            <option value="this-year">This year</option>
            <option value="clear">Clear</option>
          </select>
          <input type="date" class="filter-input filter-date" id="filter-date-start" placeholder="Start date">
          <span class="date-separator">to</span>
          <input type="date" class="filter-input filter-date" id="filter-date-end" placeholder="End date">
        </div>
      </div>
    </div>
  `;

  // Add event listeners for all text filter inputs
  const filterInputs = filtersContainer.querySelectorAll('.filter-input:not(.filter-date)');
  filterInputs.forEach(input => {
    const inputEl = input as HTMLInputElement;
    const column = inputEl.dataset.column;

    if (column) {
      inputEl.addEventListener('input', () => {
        columnFilters[column] = inputEl.value;
        applyFiltersAndRender();
      });
    }
  });

  // Add event listeners for date range inputs
  const startDateInput = document.getElementById('filter-date-start') as HTMLInputElement;
  const endDateInput = document.getElementById('filter-date-end') as HTMLInputElement;

  if (startDateInput) {
    startDateInput.addEventListener('change', () => {
      dateRangeFilter.startDate = startDateInput.value || null;
      // Reset preset dropdown when manually changing dates
      const presetSelect = document.getElementById('filter-preset') as HTMLSelectElement;
      if (presetSelect) presetSelect.value = '';
      applyFiltersAndRender();
    });
  }

  if (endDateInput) {
    endDateInput.addEventListener('change', () => {
      dateRangeFilter.endDate = endDateInput.value || null;
      // Reset preset dropdown when manually changing dates
      const presetSelect = document.getElementById('filter-preset') as HTMLSelectElement;
      if (presetSelect) presetSelect.value = '';
      applyFiltersAndRender();
    });
  }

  // Register date range filter with FilterController
  filterController.register('dateRange', () => {
    applyFiltersAndRender();
  });
}

/**
 * Apply all column filters to the data
 */
function applyAllColumnFilters(tasks: IBllTaskDto[]): IBllTaskDto[] {
  let filtered = [...tasks];

  // Filter by each column that has a value
  for (const [column, searchTerm] of Object.entries(columnFilters)) {
    if (searchTerm && searchTerm.trim()) {
      filtered = filterItems(filtered, searchTerm, {
        fields: [column],
        caseSensitive: false,
      });
    }
  }

  // Apply date range filter
  filtered = applyDateRangeFilter(filtered);

  return filtered;
}

/**
 * Apply date range filter to tasks
 * Filters tasks where the task's date falls within the selected start and end dates (inclusive on both ends)
 */
function applyDateRangeFilter(tasks: IBllTaskDto[]): IBllTaskDto[] {
  const { startDate, endDate } = dateRangeFilter;
  
  // If both dates are null/empty, return all tasks
  if (!startDate && !endDate) {
    return tasks;
  }

  return tasks.filter(task => {
    // Parse task dates
    const taskStartDate = task.startDate ? new Date(task.startDate) : null;
    const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
    
    // Use the earliest date available (startDate or dueDate) for comparison
    const taskDate = taskStartDate || taskDueDate;
    
    if (!taskDate) {
      // If task has no dates, exclude it from date filtering
      return false;
    }

    // Parse filter dates
    const filterStart = startDate ? new Date(startDate + 'T00:00:00') : null;
    const filterEnd = endDate ? new Date(endDate + 'T23:59:59') : null;

    // Scenario: Filter with both dates
    if (filterStart && filterEnd) {
      // Show tasks where startDate >= filterStart AND dueDate <= filterEnd
      // If task has no startDate, use dueDate for start comparison
      const taskStart = taskStartDate || taskDueDate;
      const taskEnd = taskDueDate || taskStartDate;
      
      if (taskStart && taskEnd) {
        return taskStart >= filterStart && taskEnd <= filterEnd;
      }
      return false;
    }

    // Scenario: Filter with only start date
    if (filterStart && !filterEnd) {
      // Show tasks where startDate >= filterStart
      const taskStart = taskStartDate || taskDueDate;
      if (!taskStart) return false;
      return taskStart >= filterStart;
    }

    // Scenario: Filter with only end date
    if (!filterStart && filterEnd) {
      // Show tasks where dueDate <= filterEnd (or startDate if no dueDate)
      const taskEnd = taskDueDate || taskStartDate;
      if (!taskEnd) return false;
      return taskEnd <= filterEnd;
    }

    return true;
  });
}

/**
 * Apply filters and re-render the table
 */
function applyFiltersAndRender(): void {
  if (!taskSorter) return;

  // Get current sort
  const sortState = taskSorter.getSortState();
  let processedTasks = taskSorter.getData();

  // Apply sort
  if (sortState) {
    processedTasks = taskSorter.sort(sortState.key);
  }

  // Apply filters
  const filtered = applyAllColumnFilters(processedTasks);

  // Update statistics
  updateStatistics(filtered);

  // Re-render
  renderTasksTable(filtered);

  // Add event listeners for action buttons
  attachActionButtonListeners();
}

/**
 * Render statistics panel
 */
function renderStatisticsPanel(): void {
  const container = document.getElementById('task-statistics-panel');
  if (!container) return;

  container.innerHTML = `
    <div class="statistics-panel">
      <div class="statistics-item">
        <span class="statistics-label">Total Tasks:</span>
        <span class="statistics-value" id="stat-total">0</span>
      </div>
      <div class="statistics-divider"></div>
      <div class="statistics-group">
        <div class="statistics-item">
          <span class="statistics-label">Todo:</span>
          <span class="statistics-value" id="stat-todo">0</span>
        </div>
        <div class="statistics-item">
          <span class="statistics-label">In Progress:</span>
          <span class="statistics-value" id="stat-in-progress">0</span>
        </div>
        <div class="statistics-item">
          <span class="statistics-label">Done:</span>
          <span class="statistics-value" id="stat-done">0</span>
        </div>
      </div>
      <div class="statistics-divider"></div>
      <div class="statistics-group">
        <div class="statistics-item">
          <span class="statistics-label">High Priority:</span>
          <span class="statistics-value stat-high" id="stat-high-priority">0</span>
        </div>
        <div class="statistics-item">
          <span class="statistics-label">Medium:</span>
          <span class="statistics-value" id="stat-medium">0</span>
        </div>
        <div class="statistics-item">
          <span class="statistics-label">Low:</span>
          <span class="statistics-value" id="stat-low">0</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Update statistics with filtered tasks
 */
function updateStatistics(tasks: IBllTaskDto[]): void {
  const total = tasks.length;
  const todo = tasks.filter(t => t.status === EStatus.TODO).length;
  const inProgress = tasks.filter(t => t.status === EStatus.IN_PROGRESS).length;
  const done = tasks.filter(t => t.status === EStatus.DONE).length;
  const highPriority = tasks.filter(t => t.priority === EPriority.HIGH).length;
  const mediumPriority = tasks.filter(t => t.priority === EPriority.MEDIUM).length;
  const lowPriority = tasks.filter(t => t.priority === EPriority.LOW).length;

  const totalEl = document.getElementById('stat-total');
  const todoEl = document.getElementById('stat-todo');
  const inProgressEl = document.getElementById('stat-in-progress');
  const doneEl = document.getElementById('stat-done');
  const highEl = document.getElementById('stat-high-priority');
  const mediumEl = document.getElementById('stat-medium');
  const lowEl = document.getElementById('stat-low');

  if (totalEl) totalEl.textContent = String(total);
  if (todoEl) todoEl.textContent = String(todo);
  if (inProgressEl) inProgressEl.textContent = String(inProgress);
  if (doneEl) doneEl.textContent = String(done);
  if (highEl) highEl.textContent = String(highPriority);
  if (mediumEl) mediumEl.textContent = String(mediumPriority);
  if (lowEl) lowEl.textContent = String(lowPriority);
}

/**
 * Render tasks table with given data
 */
function renderTasksTable(tasks: IBllTaskDto[]): void {
  const container = document.getElementById('tasks-table-container');
  if (!container) return;

  const sortState = taskSorter?.getSortState() ?? null;

  container.innerHTML = `
    <div class="table-container">
      <table class="table" id="tasks-table">
        <thead>
          <tr>
            ${getSortHeaderHtml({ key: 'title', label: 'Title' }, sortState, 'handleIndexSort')}
            ${getSortHeaderHtml({ key: 'status', label: 'Status' }, sortState, 'handleIndexSort')}
            ${getSortHeaderHtml({ key: 'priority', label: 'Priority' }, sortState, 'handleIndexSort')}
            ${getSortHeaderHtml({ key: 'categoryName', label: 'Category' }, sortState, 'handleIndexSort')}
            ${getSortHeaderHtml({ key: 'description', label: 'Description' }, sortState, 'handleIndexSort')}
            ${getSortHeaderHtml({ key: 'tags', label: 'Tags' }, sortState, 'handleIndexSort')}
            ${getSortHeaderHtml({ key: 'startDate', label: 'Start Date' }, sortState, 'handleIndexSort')}
            ${getSortHeaderHtml({ key: 'dueDate', label: 'Due Date' }, sortState, 'handleIndexSort')}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="tasks-tbody">
          ${tasks.map(task => renderTaskRow(task)).join('')}
        </tbody>
      </table>
      ${tasks.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No matching tasks</div>
          <div class="empty-state-description">Try adjusting your filters</div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render a single task row
 */
function renderTaskRow(task: IBllTaskDto): string {
  const statusClass = `badge-${task.status.toLowerCase().replace('_', '-')}`;
  const priorityClass = `badge-${task.priority.toLowerCase()}`;

  const categoryDisplay = task.categoryId && task.categoryName
    ? `<span class="badge" style="background-color: ${task.categoryColor || '#666'}">${escapeHtml(task.categoryName)}</span>`
    : '-';

  const tagsDisplay = task.tags && task.tags.length > 0
    ? task.tags.map(tag => `<span class="badge badge-tags">${escapeHtml(tag)}</span>`).join(' ')
    : '-';

  const descriptionDisplay = task.description
    ? `<span class="cell-truncate" title="${escapeHtml(task.description)}">${escapeHtml(task.description)}</span>`
    : '-';

  return `
    <tr>
      <td>${escapeHtml(task.title)}</td>
      <td><span class="badge ${statusClass}">${task.status}</span></td>
      <td><span class="badge ${priorityClass}">${task.priority}</span></td>
      <td>${categoryDisplay}</td>
      <td>${descriptionDisplay}</td>
      <td>${tagsDisplay}</td>
      <td>${task.startDate ? formatDate(task.startDate) : '-'}</td>
      <td>${task.dueDate ? formatDate(task.dueDate) : '-'}</td>
      <td class="table-actions">
        <button class="btn btn-ghost btn-sm view-task-btn" data-id="${task.id}" title="View">View</button>
        <button class="btn btn-ghost btn-sm edit-task-btn" data-id="${task.id}" title="Edit">Edit</button>
        <button class="btn btn-ghost btn-sm delete-task-btn" data-id="${task.id}" title="Delete">Delete</button>
      </td>
    </tr>
  `;
}

/**
 * Format date for display
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show Add Task Modal
 */
async function showAddTaskModal(): Promise<void> {
  // Load categories for dropdown
  const categories = await bridge.getAllCategories();
  
  // Load tasks for dependency dropdown (only TODO or IN_PROGRESS)
  const allTasks = await bridge.getAllTasks();
  const activeTasks = allTasks.filter(t => t.status === EStatus.TODO || t.status === EStatus.IN_PROGRESS);

  const modal = createModal('Add Task', `
    <form id="add-task-form">
      <div class="form-group">
        <label class="form-label" for="task-title">Title *</label>
        <input type="text" class="form-input" id="task-title" name="title" required>
        <div class="form-error" id="task-title-error"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="task-description">Description</label>
        <textarea class="form-textarea" id="task-description" name="description"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="task-status">Status</label>
          <select class="form-select" id="task-status" name="status">
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="task-priority">Priority</label>
          <select class="form-select" id="task-priority" name="priority">
            <option value="LOW">LOW</option>
            <option value="MEDIUM" selected>MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="task-start-date">Start Date</label>
          <input type="date" class="form-input" id="task-start-date" name="startDate">
        </div>
        <div class="form-group">
          <label class="form-label" for="task-due-date">Due Date</label>
          <input type="date" class="form-input" id="task-due-date" name="dueDate">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="task-tags">Tags (comma separated)</label>
        <input type="text" class="form-input" id="task-tags" name="tags" placeholder="tag1, tag2, tag3">
      </div>
      <div class="form-group">
        <label class="form-label" for="task-category">Category</label>
        <div class="category-select-wrapper">
          <select class="form-select" id="task-category" name="categoryId">
            <option value="">No category</option>
            ${categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('')}
          </select>
          <button type="button" class="btn btn-secondary btn-sm" id="add-new-category-btn">+ New</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="task-dependency">Depends On (Parent Task)</label>
        <select class="form-select" id="task-dependency" name="parentTaskId">
          <option value="">No dependency</option>
          ${activeTasks.map(task => `<option value="${task.id}">${escapeHtml(task.title)} (${task.status})</option>`).join('')}
        </select>
        <div class="form-hint">Only active tasks (TODO, IN_PROGRESS) are shown</div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-add-task-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Task</button>
      </div>
    </form>
  `);

  // Cancel button handler
  document.getElementById('cancel-add-task-btn')?.addEventListener('click', () => modal.remove());

  // Setup searchable dropdowns
  createSearchableDropdown('task-category');
  createSearchableDropdown('task-dependency');

  // Add New Category button handler
  document.getElementById('add-new-category-btn')?.addEventListener('click', async () => {
    await showCategoryCreateDialog(categories, (newCategory) => {
      // Add new category to native select
      const categorySelect = document.getElementById('task-category') as HTMLSelectElement;
      if (categorySelect) {
        const option = document.createElement('option');
        option.value = newCategory.id;
        option.textContent = newCategory.name;
        categorySelect.appendChild(option);
        categorySelect.value = newCategory.id;

        // Add new category to custom searchable dropdown
        const container = categorySelect.previousElementSibling as HTMLElement;
        if (container && container.classList.contains('searchable-select')) {
          const optionsContainer = container.querySelector('.searchable-select-options');
          if (optionsContainer) {
            const optEl = document.createElement('div');
            optEl.className = 'searchable-select-option';
            optEl.textContent = newCategory.name;
            optEl.setAttribute('data-value', newCategory.id);
            optEl.style.padding = '8px 12px';
            optEl.style.cursor = 'pointer';
            optEl.style.whiteSpace = 'nowrap';
            optEl.style.overflow = 'hidden';
            optEl.style.textOverflow = 'ellipsis';
            optEl.style.backgroundColor = '';
            
            // Hover effects
            optEl.addEventListener('mouseenter', () => {
              optEl.style.backgroundColor = '#f5f5f5';
            });
            optEl.addEventListener('mouseleave', () => {
              optEl.style.backgroundColor = '';
            });
            
            // Click handler
            optEl.addEventListener('click', () => {
              const value = optEl.getAttribute('data-value') || '';
              const text = optEl.textContent || '';
              categorySelect.value = value;
              const input = container.querySelector('input');
              if (input) input.value = text;
              const dropdown = container.querySelector('.searchable-select-dropdown') as HTMLElement;
              if (dropdown) dropdown.style.display = 'none';
              categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
            });
            
            optionsContainer.appendChild(optEl);
            
            // Update the input to show the newly selected category
            const input = container.querySelector('input');
            if (input) input.value = newCategory.name;
          }
        }
      }
    });
  });

  // Form submit handler
  document.getElementById('add-task-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Validate title
    const title = formData.get('title') as string;
    const titleError = document.getElementById('task-title-error');
    if (!title || !title.trim()) {
      if (titleError) titleError.textContent = 'Title is required';
      return;
    }
    if (titleError) titleError.textContent = '';

    // Parse tags
    const tagsStr = formData.get('tags') as string;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : undefined;

    // Get category and parent task IDs
    const categoryId = formData.get('categoryId') as string || undefined;
    const parentTaskId = formData.get('parentTaskId') as string || undefined;

    const data = {
      title: title.trim(),
      description: formData.get('description') as string || undefined,
      status: formData.get('status') as EStatus,
      priority: formData.get('priority') as EPriority,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
      dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
      tags,
      categoryId: categoryId || undefined,
      parentTaskId: parentTaskId || undefined,
    };

    try {
      await bridge.createTask(data);
      modal.remove();
      // Reload tasks to show new task
      await loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. A task cannot depend on itself.');
    }
  });
}

/**
 * Show category creation dialog
 */
async function showCategoryCreateDialog(
  existingCategories: IBllCategoryDto[],
  onCreated: (newCategory: IBllCategoryDto) => void
): Promise<void> {
  const modal = createModal('Add New Category', `
    <form id="category-create-form">
      <div class="form-group">
        <label class="form-label" for="new-category-name">Category Name *</label>
        <input type="text" class="form-input" id="new-category-name" name="name" required>
        <div class="form-error" id="category-name-error"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="new-category-color">Color</label>
        <div class="color-picker-wrapper">
          <input type="color" class="form-input form-color" id="new-category-color" name="color" value="#3B82F6">
          <span class="color-value" id="color-value-display">#3B82F6</span>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-category-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Create</button>
      </div>
    </form>
  `);

  // Color picker change handler
  const colorInput = document.getElementById('new-category-color') as HTMLInputElement;
  const colorDisplay = document.getElementById('color-value-display');
  if (colorInput && colorDisplay) {
    colorInput.addEventListener('input', () => {
      colorDisplay.textContent = colorInput.value;
    });
  }

  // Cancel button handler
  document.getElementById('cancel-category-btn')?.addEventListener('click', () => modal.remove());

  // Form submit handler
  document.getElementById('category-create-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Validate name
    const name = formData.get('name') as string;
    const nameError = document.getElementById('category-name-error');
    if (!name || !name.trim()) {
      if (nameError) nameError.textContent = 'Category name is required';
      return;
    }
    if (nameError) nameError.textContent = '';

    // Check for duplicate
    const isDuplicate = existingCategories.some(
      cat => cat.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) {
      if (nameError) nameError.textContent = 'A category with this name already exists';
      return;
    }

    const color = formData.get('color') as string || '#3B82F6';

    try {
      const newCategory = await bridge.createCategory({
        name: name.trim(),
        color,
      });

      modal.remove();
      onCreated(newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category. Please try again.');
    }
  });
}

/**
 * Create a modal
 */
function createModal(title: string, content: string): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop open';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
    </div>
  `;

  modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
  return modal;
}

/**
 * Attach event listeners for action buttons (View, Edit, Delete)
 */
function attachActionButtonListeners(): void {
  // View button handlers
  document.querySelectorAll('.view-task-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) {
        await showViewTaskModal(id);
      }
    });
  });

  // Edit button handlers
  document.querySelectorAll('.edit-task-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) {
        await showEditTaskModal(id);
      }
    });
  });

  // Delete button handlers
  document.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) {
        await showDeleteConfirmation(id);
      }
    });
  });
}

/**
 * Show view task details modal
 */
async function showViewTaskModal(taskId: string): Promise<void> {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  // Get parent task info if there's a dependency
  let parentTaskTitle = '';
  try {
    const parentTask = await bridge.getParentTask(taskId);
    if (parentTask) {
      parentTaskTitle = parentTask.title;
    }
  } catch (e) {
    // Ignore errors - task may not have a parent
  }

  const categories = await bridge.getAllCategories();
  const category = categories.find(c => c.id === task.categoryId);

  const modal = createModal('Task Details', `
    <div class="task-details">
      <div class="detail-row">
        <span class="detail-label">Title:</span>
        <span class="detail-value">${escapeHtml(task.title)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="badge badge-${task.status.toLowerCase().replace('_', '-')}">${task.status}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Priority:</span>
        <span class="badge badge-${task.priority.toLowerCase()}">${task.priority}</span>
      </div>
      ${category ? `
      <div class="detail-row">
        <span class="detail-label">Category:</span>
        <span class="badge" style="background-color: ${category.color}">${escapeHtml(category.name)}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">Description:</span>
        <span class="detail-value">${task.description ? escapeHtml(task.description) : '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Tags:</span>
        <span class="detail-value">${task.tags && task.tags.length > 0 ? task.tags.map(tag => `<span class="badge badge-tags">${escapeHtml(tag)}</span>`).join(' ') : '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Start Date:</span>
        <span class="detail-value">${task.startDate ? formatDate(task.startDate) : '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Due Date:</span>
        <span class="detail-value">${task.dueDate ? formatDate(task.dueDate) : '-'}</span>
      </div>
      ${parentTaskTitle ? `
      <div class="detail-row">
        <span class="detail-label">Depends On:</span>
        <span class="detail-value">${escapeHtml(parentTaskTitle)}</span>
      </div>
      ` : ''}
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="close-view-btn">Close</button>
      </div>
    </div>
  `);

  document.getElementById('close-view-btn')?.addEventListener('click', () => modal.remove());
}

/**
 * Show edit task modal (pre-filled with task data)
 */
async function showEditTaskModal(taskId: string): Promise<void> {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  // Get parent task info if there's a dependency
  let currentParentTaskId = '';
  try {
    const parentTask = await bridge.getParentTask(taskId);
    if (parentTask) {
      currentParentTaskId = parentTask.id;
    }
  } catch (e) {
    // Ignore errors - task may not have a parent
  }

  // Load categories for dropdown
  const categories = await bridge.getAllCategories();
  
  // Load tasks for dependency dropdown (only TODO or IN_PROGRESS)
  const allTasksData = await bridge.getAllTasks();
  const activeTasks = allTasksData.filter(t => (t.status === EStatus.TODO || t.status === EStatus.IN_PROGRESS) && t.id !== taskId);

  const modal = createModal('Edit Task', `
    <form id="edit-task-form">
      <input type="hidden" id="edit-task-id" value="${task.id}">
      <div class="form-group">
        <label class="form-label" for="edit-task-title">Title *</label>
        <input type="text" class="form-input" id="edit-task-title" name="title" value="${escapeHtml(task.title)}" required>
        <div class="form-error" id="edit-task-title-error"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-task-description">Description</label>
        <textarea class="form-textarea" id="edit-task-description" name="description">${escapeHtml(task.description || '')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="edit-task-status">Status</label>
          <select class="form-select" id="edit-task-status" name="status">
            <option value="TODO" ${task.status === EStatus.TODO ? 'selected' : ''}>TODO</option>
            <option value="IN_PROGRESS" ${task.status === EStatus.IN_PROGRESS ? 'selected' : ''}>IN_PROGRESS</option>
            <option value="DONE" ${task.status === EStatus.DONE ? 'selected' : ''}>DONE</option>
            <option value="CANCELLED" ${task.status === EStatus.CANCELLED ? 'selected' : ''}>CANCELLED</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-task-priority">Priority</label>
          <select class="form-select" id="edit-task-priority" name="priority">
            <option value="LOW" ${task.priority === EPriority.LOW ? 'selected' : ''}>LOW</option>
            <option value="MEDIUM" ${task.priority === EPriority.MEDIUM ? 'selected' : ''}>MEDIUM</option>
            <option value="HIGH" ${task.priority === EPriority.HIGH ? 'selected' : ''}>HIGH</option>
            <option value="URGENT" ${task.priority === EPriority.URGENT ? 'selected' : ''}>URGENT</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="edit-task-start-date">Start Date</label>
          <input type="date" class="form-input" id="edit-task-start-date" name="startDate" value="${task.startDate ? formatDateForInput(task.startDate) : ''}">
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-task-due-date">Due Date</label>
          <input type="date" class="form-input" id="edit-task-due-date" name="dueDate" value="${task.dueDate ? formatDateForInput(task.dueDate) : ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-task-tags">Tags (comma separated)</label>
        <input type="text" class="form-input" id="edit-task-tags" name="tags" value="${task.tags ? task.tags.join(', ') : ''}" placeholder="tag1, tag2, tag3">
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-task-category">Category</label>
        <div class="category-select-wrapper">
          <select class="form-select" id="edit-task-category" name="categoryId">
            <option value="">No category</option>
            ${categories.map(cat => `<option value="${cat.id}" ${cat.id === task.categoryId ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`).join('')}
          </select>
          <button type="button" class="btn btn-secondary btn-sm" id="add-new-category-btn">+ New</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-task-dependency">Depends On (Parent Task)</label>
        <select class="form-select" id="edit-task-dependency" name="parentTaskId">
          <option value="">No dependency</option>
          ${activeTasks.map(t => `<option value="${t.id}" ${t.id === currentParentTaskId ? 'selected' : ''}>${escapeHtml(t.title)} (${t.status})</option>`).join('')}
        </select>
        <div class="form-hint">Only active tasks (TODO, IN_PROGRESS) are shown</div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-edit-task-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Update Task</button>
      </div>
    </form>
  `);

  // Cancel button handler
  document.getElementById('cancel-edit-task-btn')?.addEventListener('click', () => modal.remove());

  // Setup searchable dropdowns
  createSearchableDropdown('edit-task-category');
  createSearchableDropdown('edit-task-dependency');

  // Add New Category button handler
  document.getElementById('add-new-category-btn')?.addEventListener('click', async () => {
    await showCategoryCreateDialog(categories, (newCategory) => {
      // Add new category to native select
      const categorySelect = document.getElementById('edit-task-category') as HTMLSelectElement;
      if (categorySelect) {
        const option = document.createElement('option');
        option.value = newCategory.id;
        option.textContent = newCategory.name;
        categorySelect.appendChild(option);
        categorySelect.value = newCategory.id;

        // Add new category to custom searchable dropdown
        const container = categorySelect.previousElementSibling as HTMLElement;
        if (container && container.classList.contains('searchable-select')) {
          const optionsContainer = container.querySelector('.searchable-select-options');
          if (optionsContainer) {
            const optEl = document.createElement('div');
            optEl.className = 'searchable-select-option';
            optEl.textContent = newCategory.name;
            optEl.setAttribute('data-value', newCategory.id);
            optEl.style.padding = '8px 12px';
            optEl.style.cursor = 'pointer';
            optEl.style.whiteSpace = 'nowrap';
            optEl.style.overflow = 'hidden';
            optEl.style.textOverflow = 'ellipsis';
            optEl.style.backgroundColor = '';
            
            // Hover effects
            optEl.addEventListener('mouseenter', () => {
              optEl.style.backgroundColor = '#f5f5f5';
            });
            optEl.addEventListener('mouseleave', () => {
              optEl.style.backgroundColor = '';
            });
            
            // Click handler
            optEl.addEventListener('click', () => {
              const value = optEl.getAttribute('data-value') || '';
              const text = optEl.textContent || '';
              categorySelect.value = value;
              const input = container.querySelector('input');
              if (input) input.value = text;
              const dropdown = container.querySelector('.searchable-select-dropdown') as HTMLElement;
              if (dropdown) dropdown.style.display = 'none';
              categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
            });
            
            optionsContainer.appendChild(optEl);
            
            // Update the input to show the newly selected category
            const input = container.querySelector('input');
            if (input) input.value = newCategory.name;
          }
        }
      }
    });
  });

  // Form submit handler
  document.getElementById('edit-task-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const taskId = (document.getElementById('edit-task-id') as HTMLInputElement).value;

    // Validate title
    const title = formData.get('title') as string;
    const titleError = document.getElementById('edit-task-title-error');
    if (!title || !title.trim()) {
      if (titleError) titleError.textContent = 'Title is required';
      return;
    }
    if (titleError) titleError.textContent = '';

    // Parse tags
    const tagsStr = formData.get('tags') as string;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : undefined;

    // Get category ID
    const categoryId = formData.get('categoryId') as string || undefined;
    
    // Get parent task ID
    const newParentTaskId = formData.get('parentTaskId') as string || undefined;

    // Update task (without parentTaskId - that's handled separately)
    const data = {
      title: title.trim(),
      description: formData.get('description') as string || undefined,
      status: formData.get('status') as EStatus,
      priority: formData.get('priority') as EPriority,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
      dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
      tags,
      categoryId: categoryId || undefined,
    };

    try {
      await bridge.updateTask(taskId, data);
      
      // Handle parent task dependency changes
      if (currentParentTaskId !== newParentTaskId) {
        // Remove old dependency if exists
        if (currentParentTaskId) {
          try {
            await bridge.removeSubtask(taskId, currentParentTaskId);
          } catch (e) {
            // Ignore if removal fails (dependency may not exist)
          }
        }
        
        // Add new dependency if specified
        if (newParentTaskId) {
          try {
            await bridge.addSubtask(taskId, newParentTaskId);
          } catch (e) {
            console.error('Error adding dependency:', e);
            alert('Error adding dependency. A task cannot depend on itself or create a circular dependency.');
            return;
          }
        }
      }
      
      modal.remove();
      // Reload tasks to show updated task
      await loadTasks();
      showToast('Task updated successfully', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task. Please try again.');
    }
  });
}

/**
 * Show delete confirmation dialog
 */
async function showDeleteConfirmation(taskId: string): Promise<void> {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  const modal = createModal('Delete Task', `
    <div class="delete-confirmation">
      <p>Are you sure you want to delete this task?</p>
      <div class="task-preview">
        <strong>${escapeHtml(task.title)}</strong>
        <span class="badge badge-${task.status.toLowerCase().replace('_', '-')}">${task.status}</span>
      </div>
      <p class="text-muted">This action cannot be undone.</p>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-delete-btn">Cancel</button>
        <button type="button" class="btn btn-danger" id="confirm-delete-btn">Delete</button>
      </div>
    </div>
  `);

  // Cancel button handler
  document.getElementById('cancel-delete-btn')?.addEventListener('click', () => modal.remove());

  // Confirm delete button handler
  document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
    try {
      await bridge.deleteTask(taskId);
      modal.remove();
      // Reload tasks to remove deleted task
      await loadTasks();
      showToast('Task deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task. Please try again.');
    }
  });
}

/**
 * Show a toast notification
 */
function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
