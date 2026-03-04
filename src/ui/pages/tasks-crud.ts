/**
 * Tasks CRUD Page
 * Page for managing tasks
 */

import { UiBridge, EStatus, EPriority } from '../services/ui-bridge.js';
import type { IBllTaskDto } from '../../bll/interfaces/dtos/index.js';
import type { ITaskCategoryEntity } from '../../interfaces/index.js';
import { TableSorter, getSortHeaderHtml } from '../../utils/sorting.js';

const bridge = new UiBridge();

// Sort state management
let taskSorter: TableSorter<IBllTaskDto> | null = null;
let currentTasks: IBllTaskDto[] = [];
let currentCategories: ITaskCategoryEntity[] = [];

/**
 * Global sort handler - must be on window for inline onclick
 */
function handleTaskSort(key: string): void {
  if (taskSorter) {
    const sorted = taskSorter.sort(key as keyof IBllTaskDto);
    renderTasksTable(sorted);
  }
}

// Expose to window for inline onclick handlers
(window as unknown as { handleTaskSort: typeof handleTaskSort }).handleTaskSort = handleTaskSort;

/**
 * Render tasks CRUD page
 */
export async function renderTasksCrud(): Promise<void> {
  // Update sidebar active state
  updateSidebarActive('/settings/tasks');
  
  const content = document.getElementById('settings-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="settings-page-header">
      <div>
        <h1 class="settings-page-title">Tasks</h1>
        <p class="settings-page-description">Manage your tasks</p>
      </div>
      <button class="btn btn-primary" id="add-task-btn">Add Task</button>
    </div>
    <div id="tasks-table-container">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;
  
  // Load tasks
  await loadTasks();
  await loadCategories();
  
  // Add button handler
  document.getElementById('add-task-btn')?.addEventListener('click', () => showTaskForm());
}

/**
 * Update sidebar active state
 */
function updateSidebarActive(path: string): void {
  document.querySelectorAll('.settings-nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${path}`) {
      link.classList.add('active');
    }
  });
}

/**
 * Load tasks into table
 */
async function loadTasks(): Promise<void> {
  const container = document.getElementById('tasks-table-container');
  if (!container) return;
  
  try {
    currentTasks = await bridge.getAllTasks();
    
    // Initialize sorter
    taskSorter = new TableSorter<IBllTaskDto>(currentTasks);
    
    if (currentTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">No tasks yet</div>
          <div class="empty-state-description">Create your first task to get started</div>
          <button class="btn btn-primary" id="add-first-task-btn">Add Task</button>
        </div>
      `;
      document.getElementById('add-first-task-btn')?.addEventListener('click', () => showTaskForm());
      return;
    }
    
    renderTasksTable(currentTasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
    container.innerHTML = `<div class="text-danger">Error loading tasks</div>`;
  }
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
      <table class="table">
        <thead>
          <tr>
            ${getSortHeaderHtml({ key: 'title', label: 'Title' }, sortState, 'handleTaskSort')}
            ${getSortHeaderHtml({ key: 'status', label: 'Status' }, sortState, 'handleTaskSort')}
            ${getSortHeaderHtml({ key: 'priority', label: 'Priority' }, sortState, 'handleTaskSort')}
            ${getSortHeaderHtml({ key: 'startDate', label: 'Start Date' }, sortState, 'handleTaskSort')}
            ${getSortHeaderHtml({ key: 'dueDate', label: 'Due Date' }, sortState, 'handleTaskSort')}
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="tasks-tbody">
          ${tasks.map(task => renderTaskRow(task)).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  // Add event listeners
  container.querySelectorAll('.edit-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) showTaskForm(id);
    });
  });
  
  container.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) confirmDeleteTask(id);
    });
  });
}

function renderTaskRow(task: IBllTaskDto): string {
  const statusClass = `badge-${task.status.toLowerCase().replace('_', '-')}`;
  const priorityClass = `badge-${task.priority.toLowerCase()}`;
  
  const categoryDisplay = task.categoryId && task.categoryName 
    ? `<span class="badge" style="background-color: ${task.categoryColor || '#666'}">${escapeHtml(task.categoryName)}</span>`
    : '-';
  
  return `
    <tr>
      <td>${escapeHtml(task.title)}</td>
      <td><span class="badge ${statusClass}">${task.status}</span></td>
      <td><span class="badge ${priorityClass}">${task.priority}</span></td>
      <td>${task.startDate ? formatDate(task.startDate) : '-'}</td>
      <td>${task.dueDate ? formatDate(task.dueDate) : '-'}</td>
      <td>${categoryDisplay}</td>
      <td class="table-actions">
        <button class="btn btn-ghost btn-sm edit-task-btn" data-id="${task.id}">Edit</button>
        <button class="btn btn-ghost btn-sm text-danger delete-task-btn" data-id="${task.id}">Delete</button>
      </td>
    </tr>
  `;
}

/**
 * Load categories for dropdown
 */
async function loadCategories(): Promise<void> {
  try {
    currentCategories = await bridge.getAllCategories();
  } catch (error) {
    console.error('Error loading categories:', error);
    currentCategories = [];
  }
}

/**
 * Show task form (create or edit)
 */
async function showTaskForm(taskId?: string): Promise<void> {
  let task: IBllTaskDto | null = null;
  if (taskId) {
    task = await bridge.getTaskById(taskId) as IBllTaskDto | null;
  }
  
  const isEdit = !!task;
  const title = isEdit ? 'Edit Task' : 'Add Task';
  
  const modal = createModal(title, `
    <form id="task-form">
      <div class="form-group">
        <label class="form-label" for="task-title">Title *</label>
        <input type="text" class="form-input" id="task-title" name="title" required value="${task ? escapeHtml(task.title) : ''}">
      </div>
      <div class="form-group">
        <label class="form-label" for="task-description">Description</label>
        <textarea class="form-textarea" id="task-description" name="description">${task?.description ? escapeHtml(task.description) : ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="task-status">Status</label>
          <select class="form-select" id="task-status" name="status">
            <option value="TODO" ${task?.status === EStatus.TODO ? 'selected' : ''}>TODO</option>
            <option value="IN_PROGRESS" ${task?.status === EStatus.IN_PROGRESS ? 'selected' : ''}>IN_PROGRESS</option>
            <option value="DONE" ${task?.status === EStatus.DONE ? 'selected' : ''}>DONE</option>
            <option value="CANCELLED" ${task?.status === EStatus.CANCELLED ? 'selected' : ''}>CANCELLED</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="task-priority">Priority</label>
          <select class="form-select" id="task-priority" name="priority">
            <option value="LOW" ${task?.priority === EPriority.LOW ? 'selected' : ''}>LOW</option>
            <option value="MEDIUM" ${task?.priority === EPriority.MEDIUM ? 'selected' : ''}>MEDIUM</option>
            <option value="HIGH" ${task?.priority === EPriority.HIGH ? 'selected' : ''}>HIGH</option>
            <option value="URGENT" ${task?.priority === EPriority.URGENT ? 'selected' : ''}>URGENT</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="task-start-date">Start Date</label>
          <input type="date" class="form-input" id="task-start-date" name="startDate" value="${task?.startDate ? formatDateForInput(task.startDate) : ''}">
        </div>
        <div class="form-group">
          <label class="form-label" for="task-due-date">Due Date</label>
          <input type="date" class="form-input" id="task-due-date" name="dueDate" value="${task?.dueDate ? formatDateForInput(task.dueDate) : ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="task-tags">Tags (comma separated)</label>
        <input type="text" class="form-input" id="task-tags" name="tags" value="${task?.tags?.join(', ') || ''}">
      </div>
      <div class="form-group">
        <label class="form-label" for="task-category">Category</label>
        <select class="form-select" id="task-category" name="categoryId">
          <option value="">No category</option>
          ${currentCategories.map(cat => `<option value="${cat.id}" ${task?.categoryId === cat.id ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`).join('')}
        </select>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-task-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Task'}</button>
      </div>
    </form>
  `);
  
  // Cancel button
  document.getElementById('cancel-task-btn')?.addEventListener('click', () => modal.remove());
  
  // Form submit
  document.getElementById('task-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const tagsStr = formData.get('tags') as string;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : undefined;
    
    const categoryId = formData.get('categoryId') as string || undefined;
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      status: formData.get('status') as EStatus,
      priority: formData.get('priority') as EPriority,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
      dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
      tags,
      categoryId: categoryId || undefined,
    };
    
    try {
      if (isEdit && taskId) {
        await bridge.updateTask(taskId, data);
      } else {
        await bridge.createTask(data);
      }
      
      modal.remove();
      await loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task');
    }
  });
}

/**
 * Confirm delete task
 */
function confirmDeleteTask(taskId: string): void {
  const modal = createModal('Delete Task', `
    <div class="confirm-dialog">
      <div class="confirm-dialog-icon">⚠️</div>
      <div class="confirm-dialog-title">Delete Task?</div>
      <div class="confirm-dialog-message">Are you sure you want to delete this task? This action cannot be undone.</div>
      <div class="confirm-dialog-actions">
        <button class="btn btn-secondary" id="cancel-delete-btn">Cancel</button>
        <button class="btn btn-danger" id="confirm-delete-btn">Delete</button>
      </div>
    </div>
  `);
  
  document.getElementById('cancel-delete-btn')?.addEventListener('click', () => modal.remove());
  document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
    try {
      await bridge.deleteTask(taskId);
      modal.remove();
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task');
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
 * Format date for display
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

/**
 * Format date for input
 */
function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export { };
