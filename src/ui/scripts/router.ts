/**
 * Router - Simple hash-based routing
 */

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
  router.register('/', () => renderHome());
  router.register('/settings', () => renderSettings());
  router.register('/settings/tasks', () => import('../pages/tasks-crud.js').then(m => m.renderTasksCrud()));
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
 * Render home page (redirect to settings)
 */
function renderHome(): void {
  router.navigate('/settings');
}

/**
 * Render settings layout
 */
function renderSettings(): void {
  const appElement = document.getElementById('app');
  if (!appElement) return;
  
  appElement.innerHTML = `
    <div class="settings-layout">
      <aside class="settings-sidebar">
        <div class="settings-sidebar-title">Settings</div>
        <nav>
          <ul class="settings-nav">
            <li class="settings-nav-item">
              <a href="#/settings/tasks" class="settings-nav-link ${getActiveClass('/settings/tasks')}">
                <span class="settings-nav-icon">📋</span>
                Tasks
              </a>
            </li>
            <li class="settings-nav-item">
              <a href="#/settings/categories" class="settings-nav-link ${getActiveClass('/settings/categories')}">
                <span class="settings-nav-icon">🏷️</span>
                Categories
              </a>
            </li>
            <li class="settings-nav-item">
              <a href="#/settings/templates" class="settings-nav-link ${getActiveClass('/settings/templates')}">
                <span class="settings-nav-icon">🔄</span>
                Recurrence Templates
              </a>
            </li>
            <li class="settings-nav-item">
              <a href="#/settings/recurring-tasks" class="settings-nav-link ${getActiveClass('/settings/recurring-tasks')}">
                <span class="settings-nav-icon">📅</span>
                Recurring Tasks
              </a>
            </li>
            <li class="settings-nav-item">
              <a href="#/settings/dependencies" class="settings-nav-link ${getActiveClass('/settings/dependencies')}">
                <span class="settings-nav-icon">🔗</span>
                Task Dependencies
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main class="settings-content" id="settings-content">
        <!-- Content loaded dynamically -->
      </main>
    </div>
    <div class="toast-container" id="toast-container"></div>
  `;
  
  // Navigate to tasks by default
  router.navigate('/settings/tasks');
}

/**
 * Get active class for navigation
 */
function getActiveClass(path: string): string {
  return router.getPath() === path ? 'active' : '';
}

export { };
