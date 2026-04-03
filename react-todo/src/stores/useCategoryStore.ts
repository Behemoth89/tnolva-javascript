import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '../types/category';

interface CategoryStore {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (payload: CreateCategoryPayload) => Promise<void>;
  updateCategory: (payload: UpdateCategoryPayload) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<Category[]>('/TodoCategories');
      set({ categories: response.data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch categories';
      set({ error: message, isLoading: false });
    }
  },

  createCategory: async (payload: CreateCategoryPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<Category>('/TodoCategories', payload);
      set((state) => ({
        categories: [response.data, ...state.categories],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create category';
      set({ error: message, isLoading: false });
    }
  },

  updateCategory: async (payload: UpdateCategoryPayload) => {
    set({ isLoading: true, error: null });
    try {
      const existing = useCategoryStore.getState().categories.find((c) => c.id === payload.id);
      if (!existing) {
        set({ error: 'Category not found', isLoading: false });
        return;
      }
      const updated = {
        ...existing,
        ...payload,
      };
      const response = await apiClient.put<Category>(`/TodoCategories/${payload.id}`, updated);
      set((state) => ({
        categories: state.categories.map((cat) => (cat.id === payload.id ? response.data : cat)),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update category';
      set({ error: message, isLoading: false });
    }
  },

  deleteCategory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/TodoCategories/${id}`);
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
