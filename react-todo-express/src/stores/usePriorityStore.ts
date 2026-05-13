import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';
import type { Priority, CreatePriorityPayload, UpdatePriorityPayload } from '../types/priority';

interface PriorityStore {
  priorities: Priority[];
  isLoading: boolean;
  error: string | null;
  fetchPriorities: () => Promise<void>;
  createPriority: (payload: CreatePriorityPayload) => Promise<void>;
  updatePriority: (payload: UpdatePriorityPayload) => Promise<void>;
  deletePriority: (id: string) => Promise<void>;
  clearError: () => void;
}

export const usePriorityStore = create<PriorityStore>((set) => ({
  priorities: [],
  isLoading: false,
  error: null,

  fetchPriorities: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<Priority[]>('/TodoPriorities');
      set({ priorities: response.data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch priorities';
      set({ error: message, isLoading: false });
    }
  },

  createPriority: async (payload: CreatePriorityPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<Priority>('/TodoPriorities', payload);
      set((state) => ({
        priorities: [response.data, ...state.priorities],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create priority';
      set({ error: message, isLoading: false });
    }
  },

  updatePriority: async (payload: UpdatePriorityPayload) => {
    set({ isLoading: true, error: null });
    try {
      const existing = usePriorityStore.getState().priorities.find((p) => p.id === payload.id);
      if (!existing) {
        set({ error: 'Priority not found', isLoading: false });
        return;
      }
      const updated = {
        ...existing,
        ...payload,
      };
      const response = await apiClient.put<Priority>(`/TodoPriorities/${payload.id}`, updated);
      set((state) => ({
        priorities: state.priorities.map((p) => (p.id === payload.id ? response.data : p)),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update priority';
      set({ error: message, isLoading: false });
    }
  },

  deletePriority: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/TodoPriorities/${id}`);
      set((state) => ({
        priorities: state.priorities.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete priority';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
