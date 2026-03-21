# Quick Start: Task Dashboard Development

## Prerequisites

- Node.js >= 20.19.0 or >= 22.12.0
- npm 10+

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Run tests**:

   ```bash
   npm run test:unit
   ```

4. **Type check**:
   ```bash
   npm run type-check
   ```

## Development Workflow

### 1. Create Components

All new components follow Vue 3 Composition API with `<script setup>`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

// Props
defineProps<{
  title: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'submit', value: string): void
}>()
</script>

<template>
  <!-- Component template -->
</template>
```

### 2. Create Stores

Pinia stores for state management:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)

  async function fetchTasks() {
    loading.value = true
    try {
      // API call
    } finally {
      loading.value = false
    }
  }

  return { tasks, loading, fetchTasks }
})
```

### 3. Testing

Unit tests with Vitest:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from './MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' },
    })
    expect(wrapper.text()).toContain('Test')
  })
})
```

## Key Files

| Path                          | Purpose                          |
| ----------------------------- | -------------------------------- |
| `src/views/DashboardView.vue` | Main dashboard page              |
| `src/views/SettingsView.vue`  | Priorities/categories management |
| `src/views/NotFoundView.vue`  | 404 page                         |
| `src/stores/tasks.ts`         | Task state management            |
| `src/stores/priorities.ts`    | Priorities CRUD                  |
| `src/stores/categories.ts`    | Categories CRUD                  |
| `src/router/index.ts`         | Route configuration              |

## API Endpoints

The frontend consumes these existing API endpoints:

- `/api/v1/TodoTasks` - Task CRUD
- `/api/v1/TodoCategories` - Category CRUD
- `/api/v1/TodoPriorities` - Priority CRUD

## Running Commands

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start dev server         |
| `npm run build`      | Production build         |
| `npm run preview`    | Preview production build |
| `npm run test`       | Run all tests            |
| `npm run lint`       | Run ESLint               |
| `npm run type-check` | Run TypeScript check     |
