/**
 * Storage Listener Composable
 * Automatically manages storage event listener lifecycle
 */

import { onMounted, onUnmounted } from 'vue'

export function useStorageListener(callback: (event: StorageEvent) => void): void {
  onMounted(() => {
    window.addEventListener('storage', callback)
  })

  onUnmounted(() => {
    window.removeEventListener('storage', callback)
  })
}
