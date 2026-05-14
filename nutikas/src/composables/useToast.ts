import { ref, provide, inject } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
  autoDismiss: boolean
}

const TOAST_SYMBOL = Symbol('toast')

function createToast() {
  const toasts = ref<Toast[]>([])
  let nextId = 0

  function dismiss(id: number): void {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function show(message: string, type: ToastType = 'info', autoDismiss = true): number {
    const id = nextId++
    const toast: Toast = { id, message, type, autoDismiss }

    if (autoDismiss) {
      setTimeout(() => dismiss(id), 3000)
    }

    toasts.value.push(toast)
    return id
  }

  function success(message: string): number {
    return show(message, 'success', true)
  }

  function error(message: string): number {
    return show(message, 'error', true)
  }

  function info(message: string): number {
    return show(message, 'info', true)
  }

  return {
    toasts,
    show,
    dismiss,
    success,
    error,
    info
  }
}

export type CreateToastReturn = ReturnType<typeof createToast>

/**
 * Provide toast functionality to child components
 * Call this at the root of your app or a high-level component
 */
export function provideToast(): void {
  provide(TOAST_SYMBOL, createToast())
}

/**
 * Access toast functionality in child components
 */
export function useToast(): CreateToastReturn {
  const toast = inject<CreateToastReturn>(TOAST_SYMBOL)
  if (!toast) {
    throw new Error('useToast() must be used within a component tree where provideToast() has been called')
  }
  return toast
}