/**
 * Infinite Scroll Composable
 * Provides lazy loading functionality for lists
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface UseInfiniteScrollOptions {
  distance?: number
  disabled?: boolean
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
  const { distance = 100, disabled = false } = options

  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const observer = ref<IntersectionObserver | null>(null)

  const handleIntersection: IntersectionObserverCallback = async (entries) => {
    const [entry] = entries

    if (entry && entry.isIntersecting && !isLoading.value && !disabled) {
      isLoading.value = true
      error.value = null

      try {
        await callback()
      } catch (err) {
        error.value = err instanceof Error ? err : new Error('Failed to load more')
      } finally {
        isLoading.value = false
      }
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
