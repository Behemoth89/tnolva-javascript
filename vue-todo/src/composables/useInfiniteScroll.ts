/**
 * Infinite Scroll Composable
 * Provides lazy loading functionality for lists
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface UseInfiniteScrollOptions {
  distance?: number
  disabled?: boolean
  debounceMs?: number
}

export function useInfiniteScroll(
  target: Ref<HTMLElement | null>,
  callback: () => Promise<void>,
  options: UseInfiniteScrollOptions = {},
): {
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  observer: Ref<IntersectionObserver | null>
} {
  const { distance = 100, disabled = false, debounceMs = 150 } = options

  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const observer = ref<IntersectionObserver | null>(null)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const handleIntersection: IntersectionObserverCallback = (entries) => {
    const [entry] = entries

    if (entry && entry.isIntersecting && !isLoading.value && !disabled) {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(async () => {
        isLoading.value = true
        error.value = null

        try {
          await callback()
        } catch (err) {
          error.value = err instanceof Error ? err : new Error('Failed to load more')
        } finally {
          isLoading.value = false
        }
      }, debounceMs)
    }
  }

  onMounted(() => {
    if (!target.value) return

    observer.value = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: `${distance}px`,
      threshold: 0,
    })

    observer.value.observe(target.value)
  })

  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
  })

  return {
    isLoading,
    error,
    observer,
  }
}
