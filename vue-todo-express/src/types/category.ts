// Category entity types - API aligned with PublicApi.DTO.v1.Todo.TodoCategory

export interface Category {
  id: string
  categoryName: string
  categorySort: number
  syncDt: string
  tag?: string | null
}

// Category creation DTO
export interface CreateCategoryDto {
  categoryName: string
  categorySort: number
  tag?: string | null
}

// Category update DTO
export interface UpdateCategoryDto {
  categoryName?: string
  categorySort?: number
  tag?: string | null
}
