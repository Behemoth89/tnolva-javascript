/**
 * Dependencies CRUD Page
 * Page for managing task dependencies (subtasks)
 */

import { UiBridge, EDependencyType } from '../services/ui-bridge.js';
import { ensureSettingsLayout } from '../scripts/router.js';
import { TableSorter, getSortHeaderHtml } from '../../utils/sorting.js';

interface Dependency {
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: EDependencyType;
  taskTitle?: string;
  dependsOnTaskTitle?: string;
}

// Sort state management
let dependencySorter: TableSorter<Dependency> | null = null;
let currentDependencies: Dependency[] = [];

// Bridge instance
let bridge: UiBridge;

/**
 * Global sort handler - must be on window for inline onclick
 */
function handleDependencySort(key: string): void {
  if (dependencySorter) {
    const sorted = dependencySorter.sort(key as keyof Dependency);
    renderDependenciesTable(sorted);
  }
}

// Expose to window for inline onclick handlers
(window as unknown as { handleDependencySort: typeof handleDependencySort }).handleDependencySort = handleDependencySort;

/**
 * Render dependencies CRUD page
 */
export async function renderDependenciesCrud(): Promise<void> {
  bridge = new UiBridge();
  
  // Update sidebar active state
  updateSidebarActive('/settings/dependencies');
  
  // Ensure settings layout exists
  const content = ensureSettingsLayout();
  if (!content) return;
  
  content.innerHTML = `
    <div class="settings-page-header">
      <div>
        <h1 class="settings-page-title">Task Dependencies</h1>
        <p class="settings-page-description">Manage task subtasks and dependencies</p>
      </div>
      <button class="btn btn-primary" id="add-dependency-btn">Add Dependency</button>
    </div>
    <div id="dependencies-table-container">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;
  
  // Load dependencies
  await loadDependencies(bridge);
  
  // Add button handler
  document.getElementById('add-dependency-btn')?.addEventListener('click', () => showDependencyForm(bridge));
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
 * Load dependencies into table
 */
async function loadDependencies(bridge: UiBridge): Promise<void> {
  const container = document.getElementById('dependencies-table-container');
  if (!container) return;
  
  try {
    const tasks = await bridge.getAllTasksForDependency();
    const dependencies = await bridge.getAllDependencies();
    
    // Enrich dependencies with task titles
    const enrichedDeps: Dependency[] = dependencies.map(dep => {
      const task = tasks.find(t => t.id === dep.taskId);
      const dependsOnTask = tasks.find(t => t.id === dep.dependsOnTaskId);
      return {
        ...dep,
        taskTitle: task?.title || 'Unknown',
        dependsOnTaskTitle: dependsOnTask?.title || 'Unknown',
      };
    });
    
    // Initialize sorter
    currentDependencies = enrichedDeps;
    dependencySorter = new TableSorter<Dependency>(currentDependencies);
    
    if (currentDependencies.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔗</div>
          <div class="empty-state-title">No task dependencies</div>
          <div class="empty-state-description">Create your first subtask relationship to get started</div>
          <button class="btn btn-primary" id="add-first-dependency-btn">Add Dependency</button>
        </div>
      `;
      document.getElementById('add-first-dependency-btn')?.addEventListener('click', () => showDependencyForm(bridge));
      return;
    }
    
    renderDependenciesTable(currentDependencies);
  } catch (error) {
    console.error('Error loading dependencies:', error);
    container.innerHTML = `<div class="text-danger">Error loading dependencies</div>`;
  }
}

/**
 * Render dependencies table with given data
 */
function renderDependenciesTable(dependencies: Dependency[]): void {
  const container = document.getElementById('dependencies-table-container');
  if (!container) return;
  
  const sortState = dependencySorter?.getSortState() ?? null;
  
  container.innerHTML = `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            ${getSortHeaderHtml({ key: 'taskTitle', label: 'Task (Subtask)' }, sortState, 'handleDependencySort')}
            ${getSortHeaderHtml({ key: 'dependsOnTaskTitle', label: 'Depends On (Parent)' }, sortState, 'handleDependencySort')}
            ${getSortHeaderHtml({ key: 'dependencyType', label: 'Type' }, sortState, 'handleDependencySort')}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="dependencies-tbody">
          ${dependencies.map(dep => renderDependencyRow(dep)).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  // Add event listeners
  container.querySelectorAll('.delete-dependency-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = (e.target as HTMLElement).dataset.taskId;
      const parentTaskId = (e.target as HTMLElement).dataset.parentTaskId;
      if (taskId && parentTaskId) confirmDeleteDependency(bridge, taskId, parentTaskId);
    });
  });
}

/**
 * Render a dependency row
 */
function renderDependencyRow(dep: Dependency): string {
  return `
    <tr>
      <td>${escapeHtml(dep.taskTitle || 'Unknown')}</td>
      <td>${escapeHtml(dep.dependsOnTaskTitle || 'Unknown')}</td>
      <td><span class="badge badge-subtask">${dep.dependencyType}</span></td>
      <td class="table-actions">
        <button class="btn btn-ghost btn-sm text-danger delete-dependency-btn" data-task-id="${dep.taskId}" data-parent-task-id="${dep.dependsOnTaskId}">Remove</button>
      </td>
    </tr>
  `;
}

/**
 * Show dependency form (create)
 */
async function showDependencyForm(bridge: UiBridge): Promise<void> {
  const tasks = await bridge.getAllTasksForDependency();
  
  if (tasks.length < 2) {
    alert('You need at least 2 tasks to create a dependency');
    return;
  }
  
  const modal = createModal('Add Dependency', `
    <form id="dependency-form">
      <div class="form-group">
        <label class="form-label" for="dependency-task">Subtask *</label>
        <select class="form-select" id="dependency-task" name="taskId" required>
          <option value="">Select a task...</option>
          ${tasks.map(t => `<option value="${t.id}">${escapeHtml(t.title)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="dependency-parent">Parent Task *</label>
        <select class="form-select" id="dependency-parent" name="parentTaskId" required>
          <option value="">Select parent task...</option>
          ${tasks.map(t => `<option value="${t.id}">${escapeHtml(t.title)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="dependency-type">Dependency Type</label>
        <select class="form-select" id="dependency-type" name="dependencyType">
          <option value="subtask">Subtask</option>
        </select>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-dependency-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Dependency</button>
      </div>
    </form>
  `);
  
  // Cancel button
  document.getElementById('cancel-dependency-btn')?.addEventListener('click', () => modal.remove());
  
  // Form submit
  document.getElementById('dependency-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const taskId = formData.get('taskId') as string;
    const parentTaskId = formData.get('parentTaskId') as string;
    
    // Validation
    if (taskId === parentTaskId) {
      alert('A task cannot depend on itself');
      return;
    }
    
    try {
      await bridge.addSubtask(taskId, parentTaskId);
      modal.remove();
      await loadDependencies(bridge);
    } catch (error: any) {
      console.error('Error adding dependency:', error);
      alert(error.message || 'Error adding dependency');
    }
  });
}

/**
 * Confirm delete dependency
 */
function confirmDeleteDependency(bridge: UiBridge, taskId: string, parentTaskId: string): void {
  const modal = createModal('Remove Dependency', `
    <div class="confirm-dialog">
      <div class="confirm-dialog-icon">⚠️</div>
      <div class="confirm-dialog-title">Remove Dependency?</div>
      <div class="confirm-dialog-message">Are you sure you want to remove this subtask relationship?</div>
      <div class="confirm-dialog-actions">
        <button class="btn btn-secondary" id="cancel-delete-btn">Cancel</button>
        <button class="btn btn-danger" id="confirm-delete-btn">Remove</button>
      </div>
    </div>
  `);
  
  document.getElementById('cancel-delete-btn')?.addEventListener('click', () => modal.remove());
  document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
    try {
      await bridge.removeSubtask(taskId, parentTaskId);
      modal.remove();
      await loadDependencies(bridge);
    } catch (error) {
      console.error('Error removing dependency:', error);
      alert('Error removing dependency');
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
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export { };
