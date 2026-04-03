export interface Priority {
  id: string;
  priorityName: string;
  prioritySort: number;
  syncDt: string | null;
  tag: string | null;
}

export interface CreatePriorityPayload {
  priorityName: string;
  prioritySort?: number;
  tag?: string | null;
}

export interface UpdatePriorityPayload extends Partial<CreatePriorityPayload> {
  id: string;
}
