<script setup lang="ts">
import { ref } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import { useUIStore } from '@/stores/ui'

defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const categoriesStore = useCategoriesStore()
const uiStore = useUIStore()

const showNewCategory = ref(false)
const newCategoryName = ref('')

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value === '' ? null : target.value
  emit('update:modelValue', value || null)
}

const handleAddCategory = async () => {
  if (!newCategoryName.value.trim()) return

  try {
    const newCategory = await categoriesStore.createCategory({
      categoryName: newCategoryName.value.trim(),
      categorySort: categoriesStore.categories.length,
    })
    emit('update:modelValue', newCategory.id)
    newCategoryName.value = ''
    showNewCategory.value = false
    uiStore.showSuccess('Category created')
  } catch {
    uiStore.showError('Failed to create category')
  }
}

const cancelNewCategory = () => {
  newCategoryName.value = ''
  showNewCategory.value = false
}
</script>

<template>
  <div class="category-select">
    <div v-if="!showNewCategory" class="select-wrapper">
      <select class="category-dropdown" :value="modelValue || ''" @change="handleChange">
        <option value="">No Category</option>
        <option
          v-for="category in categoriesStore.categories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.categoryName }}
        </option>
      </select>
      <button
        type="button"
        class="add-category-btn"
        @click="showNewCategory = true"
        title="Add new category"
      >
        +
      </button>
    </div>

    <div v-else class="new-category-form">
      <input
        v-model="newCategoryName"
        type="text"
        class="new-category-input"
        placeholder="Category name"
        @keyup.enter="handleAddCategory"
      />
      <button
        type="button"
        class="confirm-btn"
        @click="handleAddCategory"
        :disabled="!newCategoryName.trim()"
      >
        Add
      </button>
      <button type="button" class="cancel-btn" @click="cancelNewCategory">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.category-select {
  width: 100%;
}

.select-wrapper {
  display: flex;
  gap: 0.5rem;
}

.category-dropdown {
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.category-dropdown:hover {
  border-color: var(--accent-primary);
}

.category-dropdown:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.add-category-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  border-radius: 6px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-category-btn:hover {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.new-category-form {
  display: flex;
  gap: 0.5rem;
}

.new-category-input {
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.new-category-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.confirm-btn {
  padding: 0.75rem 1rem;
  background: var(--accent-primary);
  color: var(--bg-primary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
}

.confirm-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 0.75rem 1rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  border-color: var(--color-error);
  color: var(--color-error);
}
</style>
