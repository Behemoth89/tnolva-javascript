/**
 * Toast Component
 * Toast notification component for user feedback
 */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
}

/**
 * Toast notification component
 */
export class Toast {
  private container: HTMLElement | null = null;
  private defaultDuration = 3000;
  
  constructor() {
    this.initContainer();
  }
  
  /**
   * Initialize toast container
   */
  private initContainer(): void {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }
  
  /**
   * Show a toast notification
   */
  show(type: ToastType, title: string, message: string, options: ToastOptions = {}): void {
    if (!this.container) {
      this.initContainer();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${this.escapeHtml(title)}</div>
        <div class="toast-message">${this.escapeHtml(message)}</div>
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;
    
    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn?.addEventListener('click', () => this.remove(toast));
    
    this.container?.appendChild(toast);
    
    // Auto remove after duration
    const duration = options.duration ?? this.defaultDuration;
    setTimeout(() => this.remove(toast), duration);
  }
  
  /**
   * Show success toast
   */
  success(title: string, message: string): void {
    this.show('success', title, message);
  }
  
  /**
   * Show error toast
   */
  error(title: string, message: string): void {
    this.show('error', title, message);
  }
  
  /**
   * Show warning toast
   */
  warning(title: string, message: string): void {
    this.show('warning', title, message);
  }
  
  /**
   * Show info toast
   */
  info(title: string, message: string): void {
    this.show('info', title, message);
  }
  
  /**
   * Remove toast from DOM
   */
  private remove(toast: HTMLElement): void {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
  
  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
