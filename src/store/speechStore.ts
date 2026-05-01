import { create } from 'zustand';
import type { Speech } from '../types';

interface SpeechStore {
  activeSpeech: Speech | null;
  speeches: Speech[];
  caucusRound: number;
  setActiveSpeech: (speech: Speech | null) => void;
  setSpeeches: (speeches: Speech[]) => void;
  incrementCaucusRound: () => void;
  resetCaucusRound: () => void;
  getTotalSpeechTime: () => number;
  getSpeechCountBySpeaker: () => Record<string, number>;
}

export const useSpeechStore = create<SpeechStore>((set, get) => ({
  activeSpeech: null,
  speeches: [],
  caucusRound: 1,

  setActiveSpeech: (speech) => set({ activeSpeech: speech }),
  setSpeeches: (speeches) => set({ speeches }),
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
