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

// Expandable row state
let expandedTaskIds: Set<string> = new Set();

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
    attachActionButtonListeners();
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
    await renderFilterInputs();

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
    
    // Attach event listeners for action buttons
    attachActionButtonListeners();
  } catch (error) {
    console.error('Error loading tasks:', error);
    container.innerHTML = `<div class="text-danger">Error loading tasks</div>`;
  }
}

/**
 * Render filter inputs for each column
 */
async function renderFilterInputs(): Promise<void> {
  const filtersContainer = document.getElementById('index-filters');
  if (!filtersContainer) return;

  // Fetch categories for dropdown
  const categories = await bridge.getAllCategories();

  filtersContainer.innerHTML = `
    <div class="table-filters">
      <div class="filter-row">
        <input type="text" class="filter-input" id="filter-title" placeholder="Filter by title..." data-column="title">
        <select class="filter-select" id="filter-status" data-column="status">
          <option value="">All Statuses</option>
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <select class="filter-select" id="filter-priority" data-column="priority">
          <option value="">All Priorities</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="URGENT">URGENT</option>
        </select>
        <select class="filter-select" id="filter-category" data-column="categoryName">
          <option value="">All Categories</option>
          ${categories.map(cat => `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>`).join('')}
        </select>
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

  // Add event listeners for text filter inputs
  const textFilterInputs = filtersContainer.querySelectorAll('.filter-input:not(.filter-date)');
  textFilterInputs.forEach(input => {
    const inputEl = input as HTMLInputElement;
    const column = inputEl.dataset.column;

    if (column) {
      inputEl.addEventListener('input', () => {
        columnFilters[column] = inputEl.value;
        applyFiltersAndRender();
      });
    }
  });

  // Add event listeners for dropdown filter inputs (status, priority, category)
  const dropdownFilterInputs = filtersContainer.querySelectorAll('.filter-select:not(#filter-preset)');
  dropdownFilterInputs.forEach(input => {
    const selectEl = input as HTMLSelectElement;
    const column = selectEl.dataset.column;

    if (column) {
      selectEl.addEventListener('change', () => {
        columnFilters[column] = selectEl.value;
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
 * Uses overlap-based filtering:
 * - For DONE tasks: uses completionDate as end date
 * - For non-DONE tasks: uses dueDate (or 01.01.3000 if not set) as end date
 * A task is included if its date range overlaps with the filter range
 */
function applyDateRangeFilter(tasks: IBllTaskDto[]): IBllTaskDto[] {
  const { startDate, endDate } = dateRangeFilter;
  
  // If both dates are null/empty, return all tasks
  if (!startDate && !endDate) {
    return tasks;
  }

  return tasks.filter(task => {
    // Parse task dates - strip time portion for consistent comparison
    const taskStartDate = task.startDate ? new Date(task.startDate).setHours(0, 0, 0, 0) : null;
    const taskDueDate = task.dueDate ? new Date(task.dueDate).setHours(0, 0, 0, 0) : null;
    const taskCompletionDate = task.completionDate ? new Date(task.completionDate).setHours(0, 0, 0, 0) : null;
    
    // Determine end date based on task status
    // For DONE tasks: use completionDate (or fall back to dueDate if not set)
    // For other tasks (TODO, IN_PROGRESS, CANCELLED): use dueDate (or null if not set)
    let taskEndDate: number | null;
    if (task.status === EStatus.DONE && taskCompletionDate) {
      taskEndDate = taskCompletionDate;
    } else if (taskDueDate) {
      taskEndDate = taskDueDate;
    } else {
      // If no end date defined, include task in all date filters
      taskEndDate = null;
    }
    
    if (!taskStartDate) {
      // If task has no start date, include it in date filtering (can't determine range)
      return true;
    }

    // Parse filter dates - handle both ISO format (from presets) and YYYY-MM-DD format (from manual inputs)
    const parseFilterDate = (dateStr: string | null): number | null => {
      if (!dateStr) return null;
      // If already contains 'T', it's ISO format
      if (dateStr.includes('T')) {
        return new Date(dateStr).getTime();
      }
      // Otherwise, assume YYYY-MM-DD format
      return new Date(dateStr + 'T00:00:00').getTime();
    };

    const filterStart = parseFilterDate(startDate);
    const filterEnd = endDate 
      ? (endDate.includes('T') 
          ? new Date(endDate).getTime() 
          : new Date(endDate + 'T23:59:59').getTime())
      : null;

    // If task has no end date, include it based on filter
    if (taskEndDate === null) {
      if (filterStart !== null && filterEnd !== null) {
        // Task spans infinite - include if filter range is after task start
        return taskStartDate <= filterEnd;
      }
      if (filterStart !== null) {
        // Only filter start is set, include tasks that start on or after filter start
        return taskStartDate >= filterStart;
      }
      // No filter start, only end - include all tasks without end date
      return true;
    }

    // Task has both start and end dates - use overlap logic
    // Overlap-based filtering: a task is included if there's any overlap between
    // [taskStartDate, taskEndDate] and [filterStart, filterEnd]
    // Overlap exists if: max(taskStart, filterStart) <= min(taskEnd, filterEnd)
    
    // Scenario: Filter with both dates
    if (filterStart !== null && filterEnd !== null) {
      const overlapStart = taskStartDate > filterStart ? taskStartDate : filterStart;
      const overlapEnd = taskEndDate < filterEnd ? taskEndDate : filterEnd;
      return overlapStart <= overlapEnd;
    }

    // Scenario: Filter with only start date
    if (filterStart !== null && filterEnd === null) {
      // Show tasks where taskEndDate >= filterStart (any task that ends on or after filterStart)
      return taskEndDate >= filterStart;
    }

    // Scenario: Filter with only end date
    if (filterStart === null && filterEnd !== null) {
      // Show tasks where taskStartDate <= filterEnd (any task that starts on or before filterEnd)
      return taskStartDate <= filterEnd;
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
            ${getSortHeaderHtml({ key: 'completionDate', label: 'Completed At' }, sortState, 'handleIndexSort')}
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
 * Render a single task row with expandable detail
 */
function renderTaskRow(task: IBllTaskDto): string {
  const isExpanded = expandedTaskIds.has(task.id);
  const detailClass = isExpanded ? '' : 'hidden';
  const expandIcon = isExpanded ? '▼' : '▶';

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

  // Only show Done button if task is not already DONE
  const doneButton = task.status !== EStatus.DONE 
    ? `<button class="btn btn-success btn-sm done-task-btn" data-id="${task.id}" title="Mark as Done">Done</button>`
    : '';

  return `
    <tr class="task-row" data-task-id="${task.id}">
      <td><span class="task-expand-icon">${expandIcon}</span> <span class="task-title">${escapeHtml(task.title)}</span></td>
      <td><span class="badge ${statusClass}">${task.status}</span></td>
      <td><span class="badge ${priorityClass}">${task.priority}</span></td>
      <td>${categoryDisplay}</td>
      <td>${descriptionDisplay}</td>
      <td>${tagsDisplay}</td>
      <td>${task.startDate ? formatDate(task.startDate) : '-'}</td>
      <td>${task.dueDate ? formatDate(task.dueDate) : '-'}</td>
      <td>${task.completionDate ? formatDate(task.completionDate) : '-'}</td>
    </tr>
    <tr class="task-detail-row ${detailClass}" data-detail-for="${task.id}">
      <td colspan="9">
        <div class="task-detail-content">
          <div class="detail-section">
            <strong>Full Description:</strong>
            <p>${task.description ? escapeHtml(task.description) : 'No description provided'}</p>
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <strong>Created:</strong> ${formatDate(task.createdAt)}
            </div>
            <div class="detail-item">
              <strong>Last Updated:</strong> ${formatDate(task.updatedAt)}
            </div>
            ${task.completionDate ? `
            <div class="detail-item">
              <strong>Completed:</strong> ${formatDate(task.completionDate)}
            </div>` : ''}
            ${task.isSystemCreated ? '<div class="detail-item"><span class="badge badge-system">System Created</span></div>' : ''}
          </div>
          <div class="detail-actions">
            ${doneButton}
            <button class="btn btn-primary btn-sm edit-task-btn" data-id="${task.id}" title="Edit">Edit</button>
            <button class="btn btn-danger btn-sm delete-task-btn" data-id="${task.id}" title="Delete">Delete</button>
          </div>
        </div>
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
 * Toggle task detail expansion
 */
function toggleTaskDetail(taskId: string): void {
  if (expandedTaskIds.has(taskId)) {
    expandedTaskIds.delete(taskId);
  } else {
    expandedTaskIds.add(taskId);
  }
  
  // Toggle visibility using CSS classes - no re-rendering needed
  const detailRow = document.querySelector(`tr[data-detail-for="${taskId}"]`);
  if (detailRow) {
    if (expandedTaskIds.has(taskId)) {
      detailRow.classList.remove('hidden');
    } else {
      detailRow.classList.add('hidden');
    }
  }
  
  // Update expand icons in the task row
  updateExpandIcons();
}

/**
 * Update expand/collapse icons for all visible rows
 */
function updateExpandIcons(): void {
  document.querySelectorAll('.task-row').forEach(row => {
    const taskId = row.getAttribute('data-task-id');
    if (!taskId) return;
    
    const firstCell = row.querySelector('td');
    if (!firstCell) return;
    
    const isExpanded = expandedTaskIds.has(taskId);
    const expandIcon = isExpanded ? '▼' : '▶';
    
    // Update just the icon span
    const iconSpan = firstCell.querySelector('.task-expand-icon');
    if (iconSpan) {
      iconSpan.textContent = expandIcon;
    }
  });
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
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="task-completion-date">Completion Date (optional)</label>
          <input type="date" class="form-input" id="task-completion-date" name="completionDate">
          <div class="form-hint">Set planned completion date or leave empty</div>
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
      completionDate: formData.get('completionDate') ? new Date(formData.get('completionDate') as string) : undefined,
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
 * Attach event listeners for action buttons (Edit, Delete, Done)
 */
function attachActionButtonListeners(): void {
  // Task row click handler for expanding/collapsing details
  document.querySelectorAll('.task-row').forEach(row => {
    row.addEventListener('click', (e) => {
      // Stop propagation to prevent any interference with sorting
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      // Don't expand if clicking on detail actions
      if (target.closest('.detail-actions') || target.closest('button')) {
        return;
      }
      const taskId = row.getAttribute('data-task-id');
      if (taskId) {
        toggleTaskDetail(taskId);
      }
    });
  });

  // Done button handlers
  document.querySelectorAll('.done-task-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) {
        await markTaskDone(id);
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
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="edit-task-completion-date">Completion Date (optional)</label>
          <input type="date" class="form-input" id="edit-task-completion-date" name="completionDate" value="${task.completionDate ? formatDateForInput(task.completionDate) : ''}">
          <input type="hidden" id="edit-task-original-completion-date" name="originalCompletionDate" value="${task.completionDate ? formatDateForInput(task.completionDate) : ''}">
          <div class="form-hint">Set planned completion date or leave empty to keep existing</div>
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
    const completionDateStr = formData.get('completionDate') as string;
    const originalCompletionDateStr = formData.get('originalCompletionDate') as string;
    
    // Determine completionDate value:
    // - If user provided a date -> use that date
    // - If user cleared the field (empty) but there was an original date -> explicitly clear (null)
    // - If user didn't change the field -> undefined (preserve existing)
    let completionDate: Date | undefined | null;
    if (completionDateStr) {
      // User provided a date
      completionDate = new Date(completionDateStr);
    } else if (originalCompletionDateStr && !completionDateStr) {
      // User cleared the field - explicitly set to null to clear
      completionDate = null;
    } else {
      // User didn't change anything or no original value - preserve existing
      completionDate = undefined;
    }
    
    // Get the new status from form
    const newStatus = formData.get('status') as EStatus;
    
    // Check if user set completionDate but status is not DONE
    // If so, show a warning prompt
    if (completionDate && newStatus !== EStatus.DONE) {
      const shouldSetDone = confirm(
        `You have set a completion date but the status is not set to DONE.\n\n` +
        `Would you like to mark this task as DONE?`
      );
      if (!shouldSetDone) {
        // User cancelled - return without saving
        return;
      }
      // User confirmed - status will be set to DONE below
    }
    
    const data = {
      title: title.trim(),
      description: formData.get('description') as string || undefined,
      status: (completionDate && newStatus !== EStatus.DONE) ? EStatus.DONE : newStatus,
      priority: formData.get('priority') as EPriority,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
      dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
      completionDate,
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
 * Mark task as done
 */
async function markTaskDone(taskId: string): Promise<void> {
  try {
    await bridge.updateTask(taskId, { status: EStatus.DONE });
    showToast('Task marked as done', 'success');
    // Reload tasks to update the table
    await loadTasks();
  } catch (error) {
    console.error('Error marking task as done:', error);
    alert('Error marking task as done. Please try again.');
  }
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
