import { create } from 'zustand';
import type { Task } from '../types/task';

interface ModalStore {
  isOpen: boolean;
  editingTask: Task | undefined;
  openModal: (task?: Task) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  isOpen: false,
  editingTask: undefined,

  openModal: (task?: Task) =>
    set({ isOpen: true, editingTask: task }),

  closeModal: () =>
    set({ isOpen: false, editingTask: undefined }),
}));