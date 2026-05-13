<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import { useUIStore } from '@/stores/ui'
import type { Category, CreateCategoryDto } from '@/types/category'

const props = defineProps<{
  category?: Category | null
}>()

const emit = defineEmits<{
  close: []
  saved: [category: Category]
}>()

const categoriesStore = useCategoriesStore()
const uiStore = useUIStore()

const isEditing = !!props.category

const formData = ref<CreateCategoryDto>({
  categoryName: '',
  categorySort: 0,
})

watch(
  () => props.category,
  (newCategory) => {
    if (newCategory) {
      formData.value = {
        categoryName: newCategory.categoryName,
        categorySort: newCategory.categorySort,
      }
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  if (!formData.value.categoryName.trim()) {
    uiStore.showError('Category name is required')
    return
  }

  try {
    let result: Category

    if (isEditing && props.category) {
      // API requires full object with all fields for PUT request
      const updateData = {
        id: props.category.id,
        categoryName: formData.value.categoryName,
        categorySort: formData.value.categorySort,
        syncDt: props.category.syncDt,
        tag: props.category.tag ?? null,
      }
      result = await categoriesStore.updateCategory(props.category.id, updateData)
      uiStore.showSuccess('Category updated')
    } else {
      formData.value.categorySort = categoriesStore.categories.length
      result = await categoriesStore.createCategory(formData.value)
      uiStore.showSuccess('Category created')
    }

    emit('saved', result)
    emit('close')
  } catch {
    uiStore.showError(isEditing ? 'Failed to update category' : 'Failed to create category')
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="category-form-overlay" @click.self="handleClose">
    <div class="category-form">
      <div class="form-header">
        <h2>{{ isEditing ? 'Edit Category' : 'Create New Category' }}</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label" for="categoryName">Category Name *</label>
          <input
            id="categoryName"
            v-model="formData.categoryName"
            type="text"
            class="form-input"
            placeholder="Enter category name"
            maxlength="128"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="categorySort">Sort Order</label>
          <input
            id="categorySort"
            v-model.number="formData.categorySort"
            type="number"
            class="form-input"
            min="0"
          />
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="handleClose">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="categoriesStore.loading">
            {{ categoriesStore.loading ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.category-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.category-form {
  width: 100%;
  max-width: 400px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.form-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-input::placeholder {
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
</style>
