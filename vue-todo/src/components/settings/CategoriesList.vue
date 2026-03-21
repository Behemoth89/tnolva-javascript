<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import { useUIStore } from '@/stores/ui'
import CategoryForm from './CategoryForm.vue'
import type { Category } from '@/types/category'

const categoriesStore = useCategoriesStore()
const uiStore = useUIStore()

const showForm = ref(false)
const editingCategory = ref<Category | null>(null)

onMounted(async () => {
  if (categoriesStore.categories.length === 0) {
    await categoriesStore.fetchCategories()
  }
})

const handleCreate = () => {
  editingCategory.value = null
  showForm.value = true
}

const handleEdit = (category: Category) => {
  editingCategory.value = category
  showForm.value = true
}

const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this category?')) return

  try {
    await categoriesStore.deleteCategory(id)
    uiStore.showSuccess('Category deleted')
  } catch {
    uiStore.showError('Failed to delete category')
  }
}

const handleSaved = () => {
  showForm.value = false
  editingCategory.value = null
}

const handleClose = () => {
  showForm.value = false
  editingCategory.value = null
}
</script>

<template>
  <div class="categories-list">
    <div class="list-header">
      <button class="create-btn" @click="handleCreate">+ Add Category</button>
    </div>

    <div v-if="categoriesStore.loading" class="loading">Loading...</div>

    <div v-else-if="categoriesStore.categories.length === 0" class="empty">
      <p>No categories yet. Create your first category!</p>
    </div>

    <div v-else class="list-items">
      <div v-for="category in categoriesStore.categories" :key="category.id" class="list-item">
        <div class="item-info">
          <span class="item-name">{{ category.categoryName }}</span>
          <span class="item-sort">Order: {{ category.categorySort }}</span>
        </div>
        <div class="item-actions">
          <button class="edit-btn" @click="handleEdit(category)" title="Edit">✏️</button>
          <button class="delete-btn" @click="handleDelete(category.id)" title="Delete">🗑️</button>
        </div>
      </div>
    </div>

    <CategoryForm
      v-if="showForm"
      :category="editingCategory"
      @close="handleClose"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
.categories-list {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.create-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--bg-primary);
  background: var(--accent-primary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.create-btn:hover {
  background: var(--accent-hover);
}

.loading,
.empty {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.list-items {
  max-height: 300px;
  overflow-y: auto;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.list-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-name {
  font-weight: 500;
  color: var(--text-primary);
}

.item-sort {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.edit-btn:hover,
.delete-btn:hover {
  opacity: 1;
}
</style>
