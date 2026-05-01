import { create } from 'zustand';
import { useSessionStore } from './sessionStore';
import {
  subscribeToSessionDelegates,
  addDelegate,
  updateDelegate,
  softDeleteDelegate,
  bulkImportDelegates,
  updateDelegatePresence,
  recalculateEngagementScore,
} from '../lib/firestore/delegates';
import type { Delegate, EngagementWeights, SpeakerQueueEntry } from '../types';

interface DelegateStore {
  delegates: Delegate[];
  speakerQueue: SpeakerQueueEntry[];
  unsubscribe: (() => void) | null;
  subscribeToDelegates: (sessionId: string) => void;
  unsubscribeFromDelegates: () => void;
  addDelegate: (
    sessionId: string,
    data: { country: string; delegateName: string; bloc: string }
  ) => Promise<string>;
  bulkImport: (
    sessionId: string,
    rows: { country: string; delegateName: string; bloc: string }[]
  ) => Promise<void>;
  softDelete: (delegateId: string) => Promise<void>;
  togglePresence: (delegateId: string, status: 'present' | 'absent') => Promise<void>;
  recalcEngagement: (delegateId: string, weights: EngagementWeights) => Promise<void>;
  addToQueue: (delegate: Delegate) => void;
  removeFromQueue: (delegateId: string) => void;
  reorderQueue: (queue: SpeakerQueueEntry[]) => void;
  clearQueue: () => void;
  getAverageSpeechSeconds: () => number;
  getTimeEquityWarnings: (thresholdMultiplier: number) => string[];
}

export const useDelegateStore = create<DelegateStore>((set, get) => ({
  delegates: [],
  speakerQueue: [],
  unsubscribe: null,

  subscribeToDelegates: (sessionId) => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
    const unsub = subscribeToSessionDelegates(sessionId, (delegates) => {
      set({ delegates });
    });
    set({ unsubscribe: unsub });
  },

  unsubscribeFromDelegates: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null, delegates: [], speakerQueue: [] });
    }
  },

  addDelegate: async (sessionId, data) => {
    return await addDelegate(sessionId, data);
  },

  bulkImport: async (sessionId, rows) => {
    await bulkImportDelegates(sessionId, rows);
  },

  softDelete: async (delegateId) => {
    await softDeleteDelegate(delegateId);
    set((state) => ({
      speakerQueue: state.speakerQueue.filter((q) => q.delegateId !== delegateId),
    }));
  },

  togglePresence: async (delegateId, status) => {
    await updateDelegatePresence(delegateId, status as any);
  },

  recalcEngagement: async (delegateId, weights) => {
    const { delegates } = get();
    const delegate = delegates.find((d) => d.id === delegateId);
    if (delegate) {
      await recalculateEngagementScore(delegateId, delegate, weights);
    }
  },

  addToQueue: (delegate) => {
    const { session, updateSession } = useSessionStore.getState();
    if (!session) return;
    if (session.speakerQueue.some((q) => q.delegateId === delegate.id)) return;
    
    const newQueue = [
      ...session.speakerQueue,
      { delegateId: delegate.id, country: delegate.country, addedAt: Date.now() },
    ];
    updateSession({ speakerQueue: newQueue });
  },

  removeFromQueue: (delegateId) => {
    const { session, updateSession } = useSessionStore.getState();
    if (!session) return;
    const newQueue = session.speakerQueue.filter((q) => q.delegateId !== delegateId);
    updateSession({ speakerQueue: newQueue });
  },

  reorderQueue: (queue) => {
    const { updateSession } = useSessionStore.getState();
    updateSession({ speakerQueue: queue });
  },

  clearQueue: () => {
    const { updateSession } = useSessionStore.getState();
    updateSession({ speakerQueue: [] });
  },

  getAverageSpeechSeconds: () => {
    const { delegates } = get();
    const active = delegates.filter((d) => d.speechCount > 0);
    if (active.length === 0) return 0;
    const total = active.reduce((sum, d) => sum + d.totalSpeechSeconds, 0);
    return total / active.length;
  },

  getTimeEquityWarnings: (thresholdMultiplier) => {
    const { delegates } = get();
    const avg = get().getAverageSpeechSeconds();
    if (avg === 0) return [];
    const threshold = avg * thresholdMultiplier;
    return delegates
      .filter((d) => d.totalSpeechSeconds > threshold)
      .map(
        (d) =>
          `${d.country} has spoken ${Math.round(d.totalSpeechSeconds)}s (avg: ${Math.round(avg)}s)`
      );
  },
}));
