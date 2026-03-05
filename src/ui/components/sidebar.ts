/**
 * Collapsible Sidebar Component
 * Provides navigation sidebar that can be collapsed/expanded
 * State persists in localStorage
 */

// LocalStorage key for sidebar state
const SIDEBAR_STORAGE_KEY = 'app_sidebar_collapsed';

/**
 * Get sidebar collapsed state from localStorage
 */
export function getSidebarCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

/**
 * Save sidebar collapsed state to localStorage
 */
export function setSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  } catch (e) {
    console.warn('Failed to save sidebar state:', e);
  }
}

/**
 * Toggle sidebar collapsed state
 */
export function toggleSidebar(): boolean {
  const currentState = getSidebarCollapsed();
  const newState = !currentState;
  setSidebarCollapsed(newState);
  return newState;
}

/**
 * Render the collapsible sidebar
 * @param currentPath - The current active path for highlighting
 * @returns HTML string for the sidebar
 */
export function renderSidebar(currentPath: string): string {
  const isCollapsed = getSidebarCollapsed();
  
  const navItems = [
    { path: '/', label: 'Tasks (Home)', icon: '🏠' },
    { path: '/settings/tasks', label: 'Tasks', icon: '📋' },
    { path: '/settings/categories', label: 'Categories', icon: '🏷️' },
    { path: '/settings/templates', label: 'Templates', icon: '🔄' },
    { path: '/settings/recurring-tasks', label: 'Recurring Tasks', icon: '📅' },
    { path: '/settings/dependencies', label: 'Dependencies', icon: '🔗' },
  ];

  const toggleIcon = isCollapsed ? '▶' : '◀';
  const sidebarWidth = isCollapsed ? '60px' : '260px';

  return `
    <aside class="app-sidebar ${isCollapsed ? 'collapsed' : ''}" id="app-sidebar" style="width: ${sidebarWidth};">
      <div class="sidebar-header">
        <button class="sidebar-toggle" id="sidebar-toggle" title="${isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}">
          ${toggleIcon}
        </button>
      </div>
      <nav class="sidebar-nav">
        <ul class="sidebar-nav-list">
          ${navItems.map(item => `
            <li class="sidebar-nav-item">
              <a href="#${item.path}" 
                 class="sidebar-nav-link ${currentPath === item.path ? 'active' : ''}"
                 title="${isCollapsed ? item.label : ''}">
                <span class="sidebar-nav-icon">${item.icon}</span>
                <span class="sidebar-nav-label">${item.label}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </nav>
    </aside>
  `;
}

/**
 * Initialize sidebar event listeners
 */
export function initSidebar(): void {
  // Wait for DOM to be ready
  setTimeout(() => {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('app-sidebar');
    
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        const isCollapsed = toggleSidebar();
        
        // Update toggle button icon
        toggleBtn.textContent = isCollapsed ? '▶' : '◀';
        toggleBtn.title = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
        
        // Update sidebar width
        sidebar.style.width = isCollapsed ? '60px' : '260px';
        
        // Update collapsed class
        sidebar.classList.toggle('collapsed', isCollapsed);
        
        // Hide/show labels
        const labels = sidebar.querySelectorAll('.sidebar-nav-label');
        labels.forEach((label: Element) => {
          const htmlLabel = label as HTMLElement;
          htmlLabel.style.display = isCollapsed ? 'none' : 'inline';
        });
        
        // Update nav link titles for collapsed state
        const navLinks = sidebar.querySelectorAll('.sidebar-nav-link');
        navLinks.forEach((link: Element) => {
          const htmlLink = link as HTMLElement;
          if (isCollapsed) {
            const label = htmlLink.querySelector('.sidebar-nav-label');
            if (label) {
              htmlLink.title = (label as HTMLElement).textContent || '';
            }
          } else {
            htmlLink.title = '';
          }
        });
      });
    }
  }, 0);
}

/**
 * Get sidebar HTML and initialize scripts
 * @param currentPath - The current active path
 * @returns Object with HTML and initialization function
 */
export function createSidebar(currentPath: string): { html: string; init: () => void } {
  return {
    html: renderSidebar(currentPath),
    init: initSidebar,
  };
}

export { };
