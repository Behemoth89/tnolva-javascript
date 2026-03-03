/**
 * Recurrence Templates CRUD Page
 * Page for managing recurrence templates (read-only display)
 */

import { UiBridge } from '../services/ui-bridge.js';
import type { IRecurrenceTemplateEntity } from '../../interfaces/index.js';

/**
 * Render recurrence templates CRUD page
 */
export async function renderTemplatesCrud(): Promise<void> {
  const bridge = new UiBridge();
  
  // Update sidebar active state
  updateSidebarActive('/settings/templates');
  
  const content = document.getElementById('settings-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="settings-page-header">
      <div>
        <h1 class="settings-page-title">Recurrence Templates</h1>
        <p class="settings-page-description">View recurrence templates for recurring tasks</p>
      </div>
    </div>
    <div id="templates-table-container">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;
  
  // Load templates
  await loadTemplates(bridge);
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
    const templates = await bridge.getAllTemplates();
    
    if (templates.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔄</div>
          <div class="empty-state-title">No recurrence templates</div>
          <div class="empty-state-description">Templates are created when you create recurring tasks</div>
        </div>
      `;
      return;
    }
    
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
            </tr>
          </thead>
          <tbody id="templates-tbody">
            ${templates.map(template => renderTemplateRow(template)).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error loading templates:', error);
    container.innerHTML = `<div class="text-danger">Error loading templates</div>`;
  }
}

/**
 * Render a template row
 */
function renderTemplateRow(template: IRecurrenceTemplateEntity): string {
  const intervals = template.intervals?.map(i => `Every ${i.value} ${i.unit}`).join(', ') || '-';
  const duration = template.duration ? `${template.duration} days` : '-';
  
  return `
    <tr>
      <td>${escapeHtml(template.name)}</td>
      <td>${intervals}</td>
      <td>${template.dayOfMonth || '-'}</td>
      <td>${template.weekday || '-'}</td>
      <td>${duration}</td>
    </tr>
  `;
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
