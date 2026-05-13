// Category Service - API calls for TodoCategories
import { api } from './api.service'
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/category'

const CATEGORY_ENDPOINT = '/TodoCategories'

export const categoryService = {
  /**
   * Get all categories
   */
  async getAll(): Promise<Category[]> {
    return api.get<Category[]>(CATEGORY_ENDPOINT)
  },

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<Category> {
    return api.get<Category>(`${CATEGORY_ENDPOINT}/${id}`)
  },

  /**
   * Create a new category
   */
  async create(data: CreateCategoryDto): Promise<Category> {
    return api.post<Category>(CATEGORY_ENDPOINT, data)
  },

  /**
   * Update an existing category
   */
  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    return api.put<Category>(`${CATEGORY_ENDPOINT}/${id}`, data)
  },

  /**
   * Delete a category
   */
  async delete(id: string): Promise<void> {
    return api.delete<void>(`${CATEGORY_ENDPOINT}/${id}`)
  },
}

export default categoryService
