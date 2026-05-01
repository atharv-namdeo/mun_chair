import { create } from 'zustand';
import { subscribeToSessionSpeeches } from '../lib/firestore/speeches';
import { useSessionStore } from './sessionStore';
import type { Speech } from '../types';

interface SpeechStore {
  activeSpeech: Speech | null;
  speeches: Speech[];
  caucusRound: number;
  unsubscribe: (() => void) | null;
  setActiveSpeech: (speech: Speech | null) => void;
  setSpeeches: (speeches: Speech[]) => void;
  subscribeToSpeeches: (sessionId: string) => void;
  unsubscribeFromSpeeches: () => void;
  incrementCaucusRound: () => void;
  resetCaucusRound: () => void;
  getTotalSpeechTime: () => number;
  getSpeechCountBySpeaker: () => Record<string, number>;
}

export const useSpeechStore = create<SpeechStore>((set, get) => ({
  activeSpeech: null,
  speeches: [],
  caucusRound: 1,
  unsubscribe: null,

  setActiveSpeech: (speech) => {
    const { updateSession } = useSessionStore.getState();
    set({ activeSpeech: speech });
    updateSession({ activeSpeechId: speech?.id || null });
  },

  setSpeeches: (speeches) => set({ speeches }),

  subscribeToSpeeches: (sessionId) => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();

    const unsub = subscribeToSessionSpeeches(sessionId, (speeches) => {
      set({ speeches });
      // Logic to sync activeSpeech from speeches list if session.activeSpeechId is set
      const { session } = useSessionStore.getState();
      if (session?.activeSpeechId) {
        const active = speeches.find(s => s.id === session.activeSpeechId && !s.endAt);
        if (active) set({ activeSpeech: active });
      } else {
        set({ activeSpeech: null });
      }
    });
    set({ unsubscribe: unsub });
  },

  unsubscribeFromSpeeches: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null, speeches: [], activeSpeech: null });
    }
  },
  incrementCaucusRound: () => set((s) => ({ caucusRound: s.caucusRound + 1 })),
  resetCaucusRound: () => set({ caucusRound: 1 }),

  getTotalSpeechTime: () => {
    const { speeches } = get();
    return speeches.reduce((sum, s) => sum + s.usedSeconds, 0);
  },

  getSpeechCountBySpeaker: () => {
    const { speeches } = get();
    const counts: Record<string, number> = {};
    speeches.forEach((s) => {
      counts[s.delegateId] = (counts[s.delegateId] || 0) + 1;
    });
    return counts;
  },
}));
