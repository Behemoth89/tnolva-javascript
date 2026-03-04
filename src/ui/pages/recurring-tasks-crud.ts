/**
 * Recurring Tasks CRUD Page
 * Page for managing recurring tasks
 */

import { UiBridge, ERecurringTaskStatus, EPriority } from '../services/ui-bridge.js';
import type { IRecurringTaskEntity } from '../../interfaces/index.js';
import { TableSorter, getSortHeaderHtml } from '../../utils/sorting.js';

// Sort state management
let recurringTaskSorter: TableSorter<IRecurringTaskEntity> | null = null;
let currentRecurringTasks: IRecurringTaskEntity[] = [];

// Bridge instance
let bridge: UiBridge;

/**
 * Global sort handler - must be on window for inline onclick
 */
function handleRecurringTaskSort(key: string): void {
  if (recurringTaskSorter) {
    const sorted = recurringTaskSorter.sort(key as keyof IRecurringTaskEntity);
    renderRecurringTasksTable(sorted);
  }
}

// Expose to window for inline onclick handlers
(window as unknown as { handleRecurringTaskSort: typeof handleRecurringTaskSort }).handleRecurringTaskSort = handleRecurringTaskSort;

/**
 * Render recurring tasks CRUD page
 */
export async function renderRecurringTasksCrud(): Promise<void> {
  bridge = new UiBridge();
  
  // Update sidebar active state
  updateSidebarActive('/settings/recurring-tasks');
  
  const content = document.getElementById('settings-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="settings-page-header">
      <div>
        <h1 class="settings-page-title">Recurring Tasks</h1>
        <p class="settings-page-description">Manage your recurring tasks</p>
      </div>
      <button class="btn btn-primary" id="add-recurring-task-btn">Add Recurring Task</button>
    </div>
    <div id="recurring-tasks-table-container">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;
  
  // Load recurring tasks
  await loadRecurringTasks(bridge);
  
  // Add button handler
  document.getElementById('add-recurring-task-btn')?.addEventListener('click', () => showRecurringTaskForm(bridge));
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
 * Load recurring tasks into table
 */
async function loadRecurringTasks(bridge: UiBridge): Promise<void> {
  const container = document.getElementById('recurring-tasks-table-container');
  if (!container) return;
  
  try {
    const tasks = await bridge.getAllRecurringTasks();
    
    // Initialize sorter
    currentRecurringTasks = tasks;
    recurringTaskSorter = new TableSorter<IRecurringTaskEntity>(currentRecurringTasks);
    
    if (currentRecurringTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">No recurring tasks</div>
          <div class="empty-state-description">Create your first recurring task to get started</div>
          <button class="btn btn-primary" id="add-first-recurring-task-btn">Add Recurring Task</button>
        </div>
      `;
      document.getElementById('add-first-recurring-task-btn')?.addEventListener('click', () => showRecurringTaskForm(bridge));
      return;
    }
    
    renderRecurringTasksTable(currentRecurringTasks);
  } catch (error) {
    console.error('Error loading recurring tasks:', error);
    const container = document.getElementById('recurring-tasks-table-container');
    if (container) {
      container.innerHTML = `<div class="text-danger">Error loading recurring tasks</div>`;
    }
  }
}

/**
 * Render recurring tasks table with given data
 */
function renderRecurringTasksTable(tasks: IRecurringTaskEntity[]): void {
  const container = document.getElementById('recurring-tasks-table-container');
  if (!container) return;
  
  const sortState = recurringTaskSorter?.getSortState() ?? null;
  
  container.innerHTML = `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            ${getSortHeaderHtml({ key: 'title', label: 'Title' }, sortState, 'handleRecurringTaskSort')}
            ${getSortHeaderHtml({ key: 'priority', label: 'Priority' }, sortState, 'handleRecurringTaskSort')}
            ${getSortHeaderHtml({ key: 'startDate', label: 'Start Date' }, sortState, 'handleRecurringTaskSort')}
            ${getSortHeaderHtml({ key: 'endDate', label: 'End Date' }, sortState, 'handleRecurringTaskSort')}
            ${getSortHeaderHtml({ key: 'status', label: 'Status' }, sortState, 'handleRecurringTaskSort')}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="recurring-tasks-tbody">
          ${tasks.map(task => renderRecurringTaskRow(task)).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  // Add event listeners
  container.querySelectorAll('.edit-recurring-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) showRecurringTaskForm(bridge, id);
    });
  });
  
  container.querySelectorAll('.delete-recurring-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) confirmDeleteRecurringTask(bridge, id);
    });
  });
  
  container.querySelectorAll('.stop-recurring-task-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) {
        await bridge.stopRecurringTask(id);
        await loadRecurringTasks(bridge);
      }
    });
  });
  
  container.querySelectorAll('.reactivate-recurring-task-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) {
        await bridge.reactivateRecurringTask(id);
        await loadRecurringTasks(bridge);
      }
    });
  });
}

/**
 * Render a recurring task row
 */
function renderRecurringTaskRow(task: IRecurringTaskEntity): string {
  const statusClass = `badge-${task.status.toLowerCase()}`;
  const priorityClass = `badge-${task.priority?.toLowerCase() || 'medium'}`;
  const isActive = task.status === ERecurringTaskStatus.ACTIVE;
  
  return `
    <tr>
      <td>${escapeHtml(task.title)}</td>
      <td><span class="badge ${priorityClass}">${task.priority || 'MEDIUM'}</span></td>
      <td>${task.startDate ? formatDate(task.startDate) : '-'}</td>
      <td>${task.endDate ? formatDate(task.endDate) : '-'}</td>
      <td><span class="badge ${statusClass}">${task.status}</span></td>
      <td class="table-actions">
        ${isActive 
          ? `<button class="btn btn-ghost btn-sm stop-recurring-task-btn" data-id="${task.id}">Stop</button>`
          : `<button class="btn btn-ghost btn-sm reactivate-recurring-task-btn" data-id="${task.id}">Reactivate</button>`
        }
        <button class="btn btn-ghost btn-sm edit-recurring-task-btn" data-id="${task.id}">Edit</button>
        <button class="btn btn-ghost btn-sm text-danger delete-recurring-task-btn" data-id="${task.id}">Delete</button>
      </td>
    </tr>
  `;
}

/**
 * Show recurring task form (create or edit)
 */
async function showRecurringTaskForm(bridge: UiBridge, taskId?: string): Promise<void> {
  let task: IRecurringTaskEntity | null = null;
  if (taskId) {
    task = await bridge.getRecurringTaskById(taskId);
  }
  
  const isEdit = !!task;
  const title = isEdit ? 'Edit Recurring Task' : 'Add Recurring Task';
  
  const modal = createModal(title, `
    <form id="recurring-task-form">
      <div class="form-group">
        <label class="form-label" for="recurring-task-title">Title *</label>
        <input type="text" class="form-input" id="recurring-task-title" name="title" required value="${task ? escapeHtml(task.title) : ''}">
      </div>
      <div class="form-group">
        <label class="form-label" for="recurring-task-description">Description</label>
        <textarea class="form-textarea" id="recurring-task-description" name="description">${task?.description ? escapeHtml(task.description) : ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="recurring-task-priority">Priority</label>
          <select class="form-select" id="recurring-task-priority" name="priority">
            <option value="LOW" ${task?.priority === EPriority.LOW ? 'selected' : ''}>LOW</option>
            <option value="MEDIUM" ${!task?.priority || task?.priority === EPriority.MEDIUM ? 'selected' : ''}>MEDIUM</option>
            <option value="HIGH" ${task?.priority === EPriority.HIGH ? 'selected' : ''}>HIGH</option>
            <option value="URGENT" ${task?.priority === EPriority.URGENT ? 'selected' : ''}>URGENT</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="recurring-task-interval-value">Interval Value</label>
          <input type="number" class="form-input" id="recurring-task-interval-value" name="intervalValue" min="1" value="${task?.intervals?.[0]?.value || 1}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="recurring-task-interval-unit">Interval Unit</label>
          <select class="form-select" id="recurring-task-interval-unit" name="intervalUnit">
            <option value="days" ${task?.intervals?.[0]?.unit === 'days' ? 'selected' : ''}>Days</option>
            <option value="weeks" ${task?.intervals?.[0]?.unit === 'weeks' ? 'selected' : ''}>Weeks</option>
            <option value="months" ${task?.intervals?.[0]?.unit === 'months' ? 'selected' : ''}>Months</option>
            <option value="years" ${task?.intervals?.[0]?.unit === 'years' ? 'selected' : ''}>Years</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="recurring-task-duration">Duration (days, optional)</label>
          <input type="number" class="form-input" id="recurring-task-duration" name="duration" min="1" value="">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="recurring-task-start-date">Start Date *</label>
          <input type="date" class="form-input" id="recurring-task-start-date" name="startDate" required value="${task?.startDate ? formatDateForInput(task.startDate) : ''}">
        </div>
        <div class="form-group">
          <label class="form-label" for="recurring-task-end-date">End Date (optional)</label>
          <input type="date" class="form-input" id="recurring-task-end-date" name="endDate" value="${task?.endDate ? formatDateForInput(task.endDate) : ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="recurring-task-tags">Tags (comma separated)</label>
        <input type="text" class="form-input" id="recurring-task-tags" name="tags" value="${task?.tags?.join(', ') || ''}">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-recurring-task-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Recurring Task'}</button>
      </div>
    </form>
  `);
  
  // Cancel button
  document.getElementById('cancel-recurring-task-btn')?.addEventListener('click', () => modal.remove());
  
  // Form submit
  document.getElementById('recurring-task-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const tagsStr = formData.get('tags') as string;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : undefined;
    
    const intervalValue = parseInt(formData.get('intervalValue') as string) || 1;
    const intervalUnit = formData.get('intervalUnit') as string;
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined;
    
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      priority: formData.get('priority') as EPriority,
      startDate: new Date(formData.get('startDate') as string),
      endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
      intervals: [{ value: intervalValue, unit: intervalUnit }],
      tags,
      duration,
    };
    
    try {
      if (isEdit && taskId) {
        await bridge.updateRecurringTask(taskId, data);
      } else {
        await bridge.createRecurringTask(data);
      }
      
      modal.remove();
      await loadRecurringTasks(bridge);
    } catch (error) {
      console.error('Error saving recurring task:', error);
      alert('Error saving recurring task');
    }
  });
}

/**
 * Confirm delete recurring task
 */
function confirmDeleteRecurringTask(bridge: UiBridge, taskId: string): void {
  const modal = createModal('Delete Recurring Task', `
    <div class="confirm-dialog">
      <div class="confirm-dialog-icon">⚠️</div>
      <div class="confirm-dialog-title">Delete Recurring Task?</div>
      <div class="confirm-dialog-message">Are you sure you want to delete this recurring task? This will also delete all associated generated tasks. This action cannot be undone.</div>
      <div class="confirm-dialog-actions">
        <button class="btn btn-secondary" id="cancel-delete-btn">Cancel</button>
        <button class="btn btn-danger" id="confirm-delete-btn">Delete</button>
      </div>
    </div>
  `);
  
  document.getElementById('cancel-delete-btn')?.addEventListener('click', () => modal.remove());
  document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
    try {
      await bridge.deleteRecurringTask(taskId);
      modal.remove();
      await loadRecurringTasks(bridge);
    } catch (error) {
      console.error('Error deleting recurring task:', error);
      alert('Error deleting recurring task');
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
    <div class="modal modal-lg">
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
