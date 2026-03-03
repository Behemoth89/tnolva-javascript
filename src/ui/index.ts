/**
 * UI Entry Point
 * Main entry for the UI layer
 */

// Import styles
import './styles/main.css';
import './styles/components.css';
import './styles/settings.css';
import './styles/modal.css';

// Import app initialization
import { initApp } from './scripts/app.js';

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

export { };
