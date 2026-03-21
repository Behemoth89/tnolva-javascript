# Data Model: Task Dashboard

## API-Aligned Entities

The frontend data models must match the API schemas from `taltech-api.json`.

### Task (App.Domain.Todo.TodoTask)

| Field          | Type     | Required | API Field      | Description                     |
| -------------- | -------- | -------- | -------------- | ------------------------------- |
| id             | UUID     | Yes      | id             | Unique identifier               |
| taskName       | string   | Yes      | taskName       | Task title (max 128 chars)      |
| taskSort       | number   | No       | taskSort       | Display order                   |
| createdDt      | DateTime | Yes      | createdDt      | Creation timestamp              |
| dueDt          | DateTime | No       | dueDt          | Optional due date               |
| isCompleted    | boolean  | Yes      | isCompleted    | Completion status               |
| isArchived     | boolean  | No       | isArchived     | Archive status (default: false) |
| todoCategoryId | UUID     | No       | todoCategoryId | Reference to Category           |
| todoPriorityId | UUID     | No       | todoPriorityId | Reference to Priority           |
| syncDt         | DateTime | Yes      | syncDt         | Last sync timestamp             |

**Relationships**:

- Task has one Priority (via todoPriorityId)
- Task has one Category (via todoCategoryId)

### Priority (App.Domain.Todo.TodoPriority)

| Field        | Type     | Required | API Field    | Description                   |
| ------------ | -------- | -------- | ------------ | ----------------------------- |
| id           | UUID     | Yes      | id           | Unique identifier             |
| appUserId    | UUID     | Yes      | appUserId    | Owner user ID                 |
| priorityName | string   | Yes      | priorityName | Priority name (max 128 chars) |
| prioritySort | number   | Yes      | prioritySort | Display order                 |
| syncDt       | DateTime | Yes      | syncDt       | Last sync timestamp           |
| tag          | string   | No       | tag          | Additional data               |

### Category (PublicApi.DTO.v1.Todo.TodoCategory)

| Field        | Type     | Required | API Field    | Description                   |
| ------------ | -------- | -------- | ------------ | ----------------------------- |
| id           | UUID     | Yes      | id           | Unique identifier             |
| categoryName | string   | Yes      | categoryName | Category name (max 128 chars) |
| categorySort | number   | Yes      | categorySort | Display order                 |
| syncDt       | DateTime | Yes      | syncDt       | Last sync timestamp           |
| tag          | string   | No       | tag          | Additional data               |

## API Endpoints

All endpoints use version `v1` and require Bearer authentication.

### Tasks

| Method | Endpoint                 | Description     |
| ------ | ------------------------ | --------------- |
| GET    | `/api/v1/TodoTasks`      | List all tasks  |
| POST   | `/api/v1/TodoTasks`      | Create new task |
| GET    | `/api/v1/TodoTasks/{id}` | Get task by ID  |
| PUT    | `/api/v1/TodoTasks/{id}` | Update task     |
| DELETE | `/api/v1/TodoTasks/{id}` | Delete task     |

### Categories

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/v1/TodoCategories`      | List all categories |
| POST   | `/api/v1/TodoCategories`      | Create new category |
| GET    | `/api/v1/TodoCategories/{id}` | Get category by ID  |
| PUT    | `/api/v1/TodoCategories/{id}` | Update category     |
| DELETE | `/api/v1/TodoCategories/{id}` | Delete category     |

### Priorities

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/v1/TodoPriorities`      | List all priorities |
| POST   | `/api/v1/TodoPriorities`      | Create new priority |
| GET    | `/api/v1/TodoPriorities/{id}` | Get priority by ID  |
| PUT    | `/api/v1/TodoPriorities/{id}` | Update priority     |
| DELETE | `/api/v1/TodoPriorities/{id}` | Delete priority     |

## State Management (Pinia Stores)

### Tasks Store

```typescript
interface TasksState {
  tasks: Task[]
  loading: boolean
  error: string | null
  sortBy: 'priority' | 'dueDt' | 'category' | 'createdDt' | 'taskName'
  sortOrder: 'asc' | 'desc'
  filterStatus: 'all' | 'pending' | 'completed'
  filterCategory: string | null // UUID
  filterPriority: string | null // UUID
  pagination: {
    page: number
    pageSize: number
    hasMore: boolean
  }
}
```

### Priorities Store

```typescript
interface PrioritiesState {
  priorities: Priority[]
  loading: boolean
  error: string | null
}
```

### Categories Store

```typescript
interface CategoriesState {
  categories: Category[]
  loading: boolean
  error: string | null
}
```

### UI Store

```typescript
interface UIState {
  toasts: Toast[]
  modalOpen: boolean
  modalType: 'task' | 'priority' | 'category' | null
}
```

## Validation Rules

- Task taskName: Required, 1-128 characters
- Priority priorityName: Required, 1-128 characters
- Category categoryName: Required, 1-128 characters
- Due date dueDt: Must be valid DateTime if provided

## UI State Transitions

### Task Completion

```
isCompleted: false → true (toggle)
```

### Sort Options (using API field names)

```
todoPriorityId (asc/desc) - by priority
dueDt (asc/desc) - by due date
todoCategoryId (asc/desc) - by category
createdDt (asc/desc) - by creation date
taskName (asc/desc) - alphabetical
taskSort (asc/desc) - custom order
```

### Filter Options

```
isCompleted: all | false | true
todoCategoryId: UUID | null
todoPriorityId: UUID | null
```

## API Notes

- All endpoints require Bearer token authentication
- API version is `v1`
- DateTime format: ISO 8601 (e.g., "2026-03-21T12:00:00Z")
- UUID format: Standard UUID v4
- All TODO CRUD endpoints return the created/updated entity
