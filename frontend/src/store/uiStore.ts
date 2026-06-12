import { create } from 'zustand';
import type { Toast } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  toasts: Toast[];
  activeModal: string | null;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  openModal: (modalId: string) => void;
  closeModal: () => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toasts: [],
  activeModal: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clearToasts: () => set({ toasts: [] }),

  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}));
