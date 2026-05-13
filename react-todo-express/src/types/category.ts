export interface Category {
  id: string;
  categoryName: string;
  categorySort: number;
  syncDt: string | null;
  tag: string | null;
}

export interface CreateCategoryPayload {
  categoryName: string;
  categorySort?: number;
  tag?: string | null;
}

export interface UpdateCategoryPayload extends Partial<CreateCategoryPayload> {
  id: string;
}
