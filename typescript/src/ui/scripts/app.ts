/**
 * App Entry Point
 * Main application initialization and routing
 */

import { router, initRouter } from './router.js';
import { UiBridge } from '../services/ui-bridge.js';
import { Toast } from '../components/toast.js';

/**
 * Global app instance
 */
export const app = {
  bridge: null as UiBridge | null,
  toast: null as Toast | null,
};

/**
 * Initialize the application
 */
export function initApp(): void {
  console.log('Initializing Task Management UI...');
  
  // Initialize toast notifications
  app.toast = new Toast();
  
  // Initialize UI bridge
  app.bridge = new UiBridge();
  
  // Initialize router
  initRouter();
  
  // Render the app
  renderApp();
  
  console.log('Task Management UI initialized');
}

/**
 * Render the main app layout
 */
function renderApp(): void {
  const appElement = document.getElementById('app');
  if (!appElement) {
    console.error('App container not found');
    return;
  }
  
  // Start with settings page as default
  router.navigate('/settings');
}

/**
 * Show toast notification
 */
export function showToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string): void {
  if (app.toast) {
    app.toast.show(type, title, message);
  }
}

export { };
