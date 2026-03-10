/**
 * Recurrence Templates CRUD Page
 * Page for managing recurrence templates
 */

import { UiBridge } from '../services/ui-bridge.js';
import { ensureSettingsLayout } from '../scripts/router.js';
import type { IRecurrenceTemplateEntity } from '../../interfaces/index.js';

// Sort state management
let currentTemplates: IRecurrenceTemplateEntity[] = [];

// Bridge instance
let bridge: UiBridge;

/**
 * Render templates CRUD page
 */
export async function renderTemplatesCrud(): Promise<void> {
  bridge = new UiBridge();
  
  // Update sidebar active state
  updateSidebarActive('/settings/templates');
  
  // Ensure settings layout exists
  const content = ensureSettingsLayout();
  if (!content) return;
  
  content.innerHTML = `
    <div class="settings-page-header">
      <div>
        <h1 class="settings-page-title">Recurrence Templates</h1>
        <p class="settings-page-description">Manage recurrence templates for recurring tasks</p>
      </div>
      <button class="btn btn-primary" id="add-template-btn">Add Template</button>
    </div>
    <div id="templates-table-container">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;
  
  // Load templates
  await loadTemplates(bridge);
  
  // Add button handler
  document.getElementById('add-template-btn')?.addEventListener('click', () => showTemplateForm(bridge));
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
 * Load templates into table
 */
async function loadTemplates(bridge: UiBridge): Promise<void> {
  const container = document.getElementById('templates-table-container');
  if (!container) return;
  
  try {
    currentTemplates = await bridge.getAllTemplates();
    
    if (currentTemplates.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔄</div>
          <div class="empty-state-title">No recurrence templates</div>
          <div class="empty-state-description">Create your first template to get started</div>
          <button class="btn btn-primary" id="add-first-template-btn">Add Template</button>
        </div>
      `;
      document.getElementById('add-first-template-btn')?.addEventListener('click', () => showTemplateForm(bridge));
      return;
    }
    
    renderTemplatesTable(currentTemplates);
  } catch (error) {
    console.error('Error loading templates:', error);
    container.innerHTML = `<div class="text-danger">Error loading templates</div>`;
  }
}

/**
 * Render templates table with given data
 */
function renderTemplatesTable(templates: IRecurrenceTemplateEntity[]): void {
  const container = document.getElementById('templates-table-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Intervals</th>
            <th>Day of Month</th>
            <th>Weekday</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="templates-tbody">
          ${templates.map(template => renderTemplateRow(template)).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  // Add event listeners
  container.querySelectorAll('.edit-template-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) showTemplateForm(bridge, id);
    });
  });
  
  container.querySelectorAll('.delete-template-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      if (id) confirmDeleteTemplate(bridge, id);
    });
  });
}

/**
 * Render a template row
 */
function renderTemplateRow(template: IRecurrenceTemplateEntity): string {
  const intervals = template.intervals?.map(i => `Every ${i.value} ${i.unit}`).join(', ') || '-';
  const duration = template.duration ? `${template.duration} days` : '-';
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekday = template.weekday !== undefined ? weekdayNames[template.weekday] : '-';
  
  return `
    <tr>
      <td>${escapeHtml(template.name)}</td>
      <td>${intervals}</td>
      <td>${template.dayOfMonth || '-'}</td>
      <td>${weekday}</td>
      <td>${duration}</td>
      <td class="table-actions">
        <button class="btn btn-ghost btn-sm edit-template-btn" data-id="${template.id}">Edit</button>
        <button class="btn btn-ghost btn-sm text-danger delete-template-btn" data-id="${template.id}">Delete</button>
      </td>
    </tr>
  `;
}

/**
 * Show template form (create or edit)
 */
async function showTemplateForm(bridge: UiBridge, templateId?: string): Promise<void> {
  let template: IRecurrenceTemplateEntity | null = null;
  if (templateId) {
    template = await bridge.getTemplateById(templateId);
  }
  
  const isEdit = !!template;
  const title = isEdit ? 'Edit Template' : 'Add Template';
  
  // Build intervals HTML
  const intervals = template?.intervals || [{ value: 1, unit: 'days' }];
  const intervalsHtml = intervals.map((interval, index) => `
    <div class="interval-row">
      <input type="number" class="form-input" name="interval-value" value="${interval.value}" min="1" required>
      <select class="form-input" name="interval-unit">
        <option value="days" ${interval.unit === 'days' ? 'selected' : ''}>Days</option>
        <option value="weeks" ${interval.unit === 'weeks' ? 'selected' : ''}>Weeks</option>
        <option value="months" ${interval.unit === 'months' ? 'selected' : ''}>Months</option>
        <option value="years" ${interval.unit === 'years' ? 'selected' : ''}>Years</option>
      </select>
      ${index > 0 ? `<button type="button" class="btn btn-ghost btn-sm remove-interval-btn">×</button>` : ''}
    </div>
  `).join('');
  
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdayOptions = weekdayNames.map((name, index) => 
    `<option value="${index}" ${template?.weekday === index ? 'selected' : ''}>${name}</option>`
  ).join('');
  
  const modal = createModal(title, `
    <form id="template-form">
      <div class="form-group">
        <label class="form-label" for="template-name">Name *</label>
        <input type="text" class="form-input" id="template-name" name="name" required value="${template ? escapeHtml(template.name) : ''}" placeholder="e.g., Every 2 weeks">
      </div>
      
      <div class="form-group">
        <label class="form-label">Intervals *</label>
        <div id="intervals-container">
          ${intervalsHtml}
        </div>
        <button type="button" class="btn btn-ghost btn-sm" id="add-interval-btn">+ Add Interval</button>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="template-day-of-month">Day of Month (1-31)</label>
        <input type="number" class="form-input" id="template-day-of-month" name="dayOfMonth" min="1" max="31" value="${template?.dayOfMonth || ''}">
      </div>
      
      <div class="form-group">
        <label class="form-label" for="template-weekday">Weekday</label>
        <select class="form-input" id="template-weekday" name="weekday">
          <option value="">-- Select --</option>
          ${weekdayOptions}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="template-duration">Duration (days)</label>
        <input type="number" class="form-input" id="template-duration" name="duration" min="0" value="${template?.duration || ''}">
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-template-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Template'}</button>
      </div>
    </form>
  `);
  
  // Cancel button
  document.getElementById('cancel-template-btn')?.addEventListener('click', () => modal.remove());
  
  // Add interval button
  document.getElementById('add-interval-btn')?.addEventListener('click', () => {
    const container = document.getElementById('intervals-container');
    if (container) {
      const row = document.createElement('div');
      row.className = 'interval-row';
      row.innerHTML = `
        <input type="number" class="form-input" name="interval-value" value="1" min="1" required>
        <select class="form-input" name="interval-unit">
          <option value="days" selected>Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </select>
        <button type="button" class="btn btn-ghost btn-sm remove-interval-btn">×</button>
      `;
      container.appendChild(row);
      
      row.querySelector('.remove-interval-btn')?.addEventListener('click', () => row.remove());
    }
  });
  
  // Remove interval buttons
  modal.querySelectorAll('.remove-interval-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      (e.target as HTMLElement).closest('.interval-row')?.remove();
    });
  });
  
  // Form submit
  document.getElementById('template-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    
    // Collect intervals
    const intervalValues = form.querySelectorAll<HTMLInputElement>('input[name="interval-value"]');
    const intervalUnits = form.querySelectorAll<HTMLSelectElement>('select[name="interval-unit"]');
    const intervals: { value: number; unit: string }[] = [];
    
    intervalValues.forEach((valueInput, index) => {
      intervals.push({
        value: parseInt(valueInput.value, 10),
        unit: intervalUnits[index].value,
      });
    });
    
    const dayOfMonthInput = form.querySelector<HTMLInputElement>('#template-day-of-month');
    const weekdayInput = form.querySelector<HTMLSelectElement>('#template-weekday');
    const durationInput = form.querySelector<HTMLInputElement>('#template-duration');
    
    const data = {
      name: (form.querySelector('#template-name') as HTMLInputElement).value,
      intervals,
      dayOfMonth: dayOfMonthInput?.value ? parseInt(dayOfMonthInput.value, 10) : undefined,
      weekday: weekdayInput?.value ? parseInt(weekdayInput.value, 10) : undefined,
      duration: durationInput?.value ? parseInt(durationInput.value, 10) : undefined,
    };
    
    try {
      if (isEdit && templateId) {
        await bridge.updateTemplate(templateId, data);
      } else {
        await bridge.createTemplate(data);
      }
      
      modal.remove();
      await loadTemplates(bridge);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    }
  });
}

/**
 * Confirm delete template
 */
function confirmDeleteTemplate(bridge: UiBridge, templateId: string): void {
  const modal = createModal('Delete Template', `
    <div class="confirm-dialog">
      <div class="confirm-dialog-icon">⚠️</div>
      <div class="confirm-dialog-title">Delete Template?</div>
      <div class="confirm-dialog-message">Are you sure you want to delete this template? This action cannot be undone.</div>
      <div class="confirm-dialog-actions">
        <button class="btn btn-secondary" id="cancel-delete-btn">Cancel</button>
        <button class="btn btn-danger" id="confirm-delete-btn">Delete</button>
      </div>
    </div>
  `);
  
  document.getElementById('cancel-delete-btn')?.addEventListener('click', () => modal.remove());
  document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
    try {
      await bridge.deleteTemplate(templateId);
      modal.remove();
      await loadTemplates(bridge);
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
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
