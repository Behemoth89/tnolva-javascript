/**
 * Categories CRUD Page
 * Page for managing task categories
 */

import { UiBridge } from '../services/ui-bridge.js';
import type { ITaskCategoryEntity } from '../../interfaces/index.js';

/**
 * Render categories CRUD page
 */
export async function renderCategoriesCrud(): Promise<void> {
  const bridge = new UiBridge();
  
  // Update sidebar active state
  updateSidebarActive('/settings/categories');
  
  const content = document.getElementById('settings-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="settings-page-header">
      <div>
        <h1 class="settings-page-title">Categories</h1>
        <p class="settings-page-description">Manage your task categories</p>
      </div>
      <button class="btn btn-primary" id="add-category-btn">Add Category</button>
    </div>
    <div id="categories-table-container">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;
  
  // Load categories
  await loadCategories(bridge);
  
  // Add button handler
  document.getElementById('add-category-btn')?.addEventListener('click', () => showCategoryForm(bridge));
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
 * Load categories into table
 */
async function loadCategories(bridge: UiBridge): Promise<void> {
  const container = document.getElementById('categories-table-container');
  if (!container) return;
  
  try {
    const categories = await bridge.getAllCategories();
    
    if (categories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏷️</div>
          <div class="empty-state-title">No categories yet</div>
          <div class="empty-state-description">Create your first category to get started</div>
          <button class="btn btn-primary" id="add-first-category-btn">Add Category</button>
        </div>
      `;
      document.getElementById('add-first-category-btn')?.addEventListener('click', () => showCategoryForm(bridge));
      return;
    }
    
    container.innerHTML = `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Color</th>
              <th>Name</th>
              <th>Description</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="categories-tbody">
            ${categories.map(category => renderCategoryRow(category)).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    // Add event listeners
    container.querySelectorAll('.edit-category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id;
        if (id) showCategoryForm(bridge, id);
      });
    });
    
    container.querySelectorAll('.delete-category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id;
        if (id) confirmDeleteCategory(bridge, id);
      });
    });
  } catch (error) {
    console.error('Error loading categories:', error);
    container.innerHTML = `<div class="text-danger">Error loading categories</div>`;
  }
}

/**
 * Render a category row
 */
function renderCategoryRow(category: ITaskCategoryEntity): string {
  const color = category.color || '#cccccc';
  
  return `
    <tr>
      <td><span class="color-swatch" style="background-color: ${color}"></span></td>
      <td>${escapeHtml(category.name)}</td>
      <td>${category.description ? escapeHtml(category.description) : '-'}</td>
      <td>${category.createdAt ? formatDate(category.createdAt) : '-'}</td>
      <td class="table-actions">
        <button class="btn btn-ghost btn-sm edit-category-btn" data-id="${category.id}">Edit</button>
        <button class="btn btn-ghost btn-sm text-danger delete-category-btn" data-id="${category.id}">Delete</button>
      </td>
    </tr>
  `;
}

/**
 * Show category form (create or edit)
 */
async function showCategoryForm(bridge: UiBridge, categoryId?: string): Promise<void> {
  let category: ITaskCategoryEntity | null = null;
  if (categoryId) {
    category = await bridge.getCategoryById(categoryId);
  }
  
  const isEdit = !!category;
  const title = isEdit ? 'Edit Category' : 'Add Category';
  
  const modal = createModal(title, `
    <form id="category-form">
      <div class="form-group">
        <label class="form-label" for="category-name">Name *</label>
        <input type="text" class="form-input" id="category-name" name="name" required value="${category ? escapeHtml(category.name) : ''}">
      </div>
      <div class="form-group">
        <label class="form-label" for="category-description">Description</label>
        <textarea class="form-textarea" id="category-description" name="description">${category?.description ? escapeHtml(category.description) : ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label" for="category-color">Color</label>
        <input type="color" class="form-input" id="category-color" name="color" value="${category?.color || '#2563eb'}" style="height: 40px; padding: 4px;">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-category-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Category'}</button>
      </div>
    </form>
  `);
  
  // Cancel button
  document.getElementById('cancel-category-btn')?.addEventListener('click', () => modal.remove());
  
  // Form submit
  document.getElementById('category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      color: formData.get('color') as string || undefined,
    };
    
    try {
      if (isEdit && categoryId) {
        await bridge.updateCategory(categoryId, data);
      } else {
        await bridge.createCategory(data);
      }
      
      modal.remove();
      await loadCategories(bridge);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  });
}

/**
 * Confirm delete category
 */
function confirmDeleteCategory(bridge: UiBridge, categoryId: string): void {
  const modal = createModal('Delete Category', `
    <div class="confirm-dialog">
      <div class="confirm-dialog-icon">⚠️</div>
      <div class="confirm-dialog-title">Delete Category?</div>
      <div class="confirm-dialog-message">Are you sure you want to delete this category? This action cannot be undone.</div>
      <div class="confirm-dialog-actions">
        <button class="btn btn-secondary" id="cancel-delete-btn">Cancel</button>
        <button class="btn btn-danger" id="confirm-delete-btn">Delete</button>
      </div>
    </div>
  `);
  
  document.getElementById('cancel-delete-btn')?.addEventListener('click', () => modal.remove());
  document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
    try {
      await bridge.deleteCategory(categoryId);
      modal.remove();
      await loadCategories(bridge);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
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
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export { };
