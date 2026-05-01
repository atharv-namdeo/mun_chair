import { create } from 'zustand';
import type { TimelineEvent } from '../types';

type ModalType =
  | 'addDelegate'
  | 'csvImport'
  | 'newSession'
  | 'motion'
  | 'voting'
  | 'poi'
  | 'poo'
  | 'yield'
  | 'settings'
  | 'sessionComparison'
  | 'resolutionTracker'
  | null;

interface UIStore {
  activeModal: ModalType;
  modalData: Record<string, unknown>;
  isOnline: boolean;
  undoStack: TimelineEvent[];
  sidebarCollapsed: boolean;
  activePage: string;
  notificationQueue: { id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }[];

  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  setOnline: (online: boolean) => void;
  setUndoStack: (stack: TimelineEvent[]) => void;
  pushUndo: (event: TimelineEvent) => void;
  popUndo: () => TimelineEvent | null;
  toggleSidebar: () => void;
  setActivePage: (page: string) => void;
  addNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  activeModal: null,
  modalData: {},
  isOnline: navigator.onLine,
  undoStack: [],
  sidebarCollapsed: false,
  activePage: 'home',
  notificationQueue: [],

  openModal: (modal, data = {}) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),

  setOnline: (online) => set({ isOnline: online }),

  setUndoStack: (stack) => set({ undoStack: stack }),

  pushUndo: (event) =>
    set((state) => ({
      undoStack: [event, ...state.undoStack].slice(0, 20),
    })),

  popUndo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;
    const [top, ...rest] = undoStack;
    set({ undoStack: rest });
    return top;
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActivePage: (page) => set({ activePage: page }),

  addNotification: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      notificationQueue: [...state.notificationQueue, { id, message, type }],
    }));
    setTimeout(() => get().removeNotification(id), 4000);
  },

  removeNotification: (id) =>
    set((state) => ({
      notificationQueue: state.notificationQueue.filter((n) => n.id !== id),
    })),
}));
