/**
 * Router - Simple hash-based routing
 */

import { renderSidebar, initSidebar } from '../components/sidebar.js';

type RouteHandler = () => void;

interface Route {
  path: string;
  handler: RouteHandler;
}

/**
 * Simple hash-based router
 */
export const router = {
  routes: [] as Route[],
  currentPath: '',
  
  /**
   * Register a route
   */
  register(path: string, handler: RouteHandler): void {
    this.routes.push({ path, handler });
  },
  
  /**
   * Navigate to a path
   */
  navigate(path: string): void {
    window.location.hash = path;
  },
  
  /**
   * Get current path
   */
  getPath(): string {
    const hash = window.location.hash;
    return hash.startsWith('#') ? hash.slice(1) : hash || '/';
  },
  
  /**
   * Match route and execute handler
   */
  resolve(): void {
    const path = this.getPath();
    this.currentPath = path;
    
    // Find matching route
    const route = this.routes.find(r => r.path === path);
    
    if (route) {
      route.handler();
    } else {
      // Default to settings
      this.navigate('/settings');
    }
  },
};

/**
 * Initialize the router with routes
 */
export function initRouter(): void {
  // Register routes
  router.register('/', () => import('../pages/index.js').then(m => m.renderIndexPage()));
  router.register('/settings', () => renderSettings());
  router.register('/settings/categories', () => import('../pages/categories-crud.js').then(m => m.renderCategoriesCrud()));
  router.register('/settings/templates', () => import('../pages/recurrence-templates-crud.js').then(m => m.renderTemplatesCrud()));
  router.register('/settings/recurring-tasks', () => import('../pages/recurring-tasks-crud.js').then(m => m.renderRecurringTasksCrud()));
  router.register('/settings/dependencies', () => import('../pages/dependencies-crud.js').then(m => m.renderDependenciesCrud()));
  
  // Handle hash changes
  window.addEventListener('hashchange', () => router.resolve());
  
  // Initial route
  router.resolve();
}

/**
 * Render settings layout
 */
function renderSettings(): void {
  const appElement = document.getElementById('app');
  if (!appElement) return;
  
  const currentPath = router.getPath();
  
  appElement.innerHTML = `
    <div class="settings-layout">
      ${renderSidebar(currentPath)}
      <main class="settings-content" id="settings-content">
        <!-- Content loaded dynamically -->
      </main>
    </div>
    <div class="toast-container" id="toast-container"></div>
  `;
  
  // Initialize sidebar toggle
  initSidebar();
  
  // Navigate to categories by default
  router.navigate('/settings/categories');
}

export { };
