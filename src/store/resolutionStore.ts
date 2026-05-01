import { create } from 'zustand';
import type { Resolution } from '../types';
import { subscribeToResolutions } from '../lib/firestore/resolutions';

interface ResolutionStore {
  resolutions: Resolution[];
  isLoading: boolean;
  unsubscribe: (() => void) | null;
  
  subscribeToResolutions: (sessionId: string) => void;
  setResolutions: (resolutions: Resolution[]) => void;
}

export const useResolutionStore = create<ResolutionStore>((set, get) => ({
  resolutions: [],
  isLoading: false,
  unsubscribe: null,

  subscribeToResolutions: (sessionId: string) => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();

    set({ isLoading: true });
    const unsub = subscribeToResolutions(sessionId, (resolutions) => {
      set({ resolutions, isLoading: false });
    });
    set({ unsubscribe: unsub });
  },

  setResolutions: (resolutions) => set({ resolutions }),
}));
