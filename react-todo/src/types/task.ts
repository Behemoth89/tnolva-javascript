export interface Task {
  id: string;
  taskName: string | null;
  taskSort: number;
  createdDt: string;
  dueDt: string | null;
  isCompleted: boolean;
  isArchived: boolean;
  todoCategoryId: string;
  todoPriorityId: string;
  syncDt: string;
}

export interface CreateTaskPayload {
  taskName: string;
  dueDt?: string | null;
  todoCategoryId?: string | null;
  todoPriorityId?: string | null;
  taskSort?: number;
  isCompleted?: boolean;
  isArchived?: boolean;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  id: string;
}
