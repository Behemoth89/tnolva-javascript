/**
 * Categories Pinia Store
 * Manages category CRUD operations
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/category'
import categoryService from '@/services/category.service'

export const useCategoriesStore = defineStore('categories', () => {
  // State
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions

  /**
   * Fetch all categories from API
   */
  async function fetchCategories(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      categories.value = await categoryService.getAll()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch categories'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new category
   */
  async function createCategory(data: CreateCategoryDto): Promise<Category> {
    loading.value = true
    error.value = null

    try {
      const newCategory = await categoryService.create(data)
      categories.value.push(newCategory)
      return newCategory
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create category'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing category
   */
  async function updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    loading.value = true
    error.value = null

    try {
      const updatedCategory = await categoryService.update(id, data)
      const index = categories.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        categories.value[index] = updatedCategory
      }
      return updatedCategory
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update category'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a category
   */
  async function deleteCategory(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await categoryService.delete(id)
      categories.value = categories.value.filter((c) => c.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete category'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get category by ID
   */
  function getCategoryById(id: string): Category | undefined {
    return categories.value.find((c) => c.id === id)
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null
  }

  return {
    // State
    categories,
    loading,
    error,

    // Actions
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    clearError,
  }
})
