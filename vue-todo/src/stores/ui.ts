/**
 * UI Pinia Store
 * Manages UI state: toasts, modals, loading states
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export type ModalType = 'task' | 'priority' | 'category' | null

export const useUIStore = defineStore('ui', () => {
  // State
  const toasts = ref<Toast[]>([])
  const modalOpen = ref(false)
  const modalType = ref<ModalType>(null)
  const globalLoading = ref(false)

  // Actions

  /**
   * Show a toast notification
   */
  function showToast(message: string, type: Toast['type'] = 'info', duration = 3000): void {
    const id = crypto.randomUUID()
    const toast: Toast = { id, message, type, duration }

    toasts.value.push(toast)

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  /**
   * Remove a toast by ID
   */
  function removeToast(id: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  /**
   * Show success toast
   */
  function showSuccess(message: string): void {
    showToast(message, 'success')
  }

  /**
   * Show error toast
   */
  function showError(message: string, duration = 5000): void {
    showToast(message, 'error', duration)
  }

  /**
   * Show warning toast
   */
  function showWarning(message: string): void {
    showToast(message, 'warning')
  }

  /**
   * Show info toast
   */
  function showInfo(message: string): void {
    showToast(message, 'info')
  }

  /**
   * Open modal
   */
  function openModal(type: ModalType): void {
    modalType.value = type
    modalOpen.value = true
  }

  /**
   * Close modal
   */
  function closeModal(): void {
    modalOpen.value = false
    modalType.value = null
  }

  /**
   * Set global loading state
   */
  function setGlobalLoading(loading: boolean): void {
    globalLoading.value = loading
  }

  /**
   * Clear all toasts
   */
  function clearToasts(): void {
    toasts.value = []
  }

  return {
    // State
    toasts,
    modalOpen,
    modalType,
    globalLoading,

    // Actions
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    openModal,
    closeModal,
    setGlobalLoading,
    clearToasts,
  }
})
