import { create } from 'zustand';
import {
  subscribeToSessionMotions,
  proposeMotion,
  updateMotionStatus,
} from '../lib/firestore/motions';
import type { Motion, MotionType, VoteType } from '../types';

interface MotionStore {
  motions: Motion[];
  activeMotion: Motion | null;
  unsubscribe: (() => void) | null;
  subscribeToMotions: (sessionId: string) => void;
  unsubscribeFromMotions: () => void;
  proposeMotion: (
    sessionId: string,
    proposerDelegateId: string,
    proposerCountry: string,
    type: MotionType,
    description: string,
    speakingTimeSeconds: number | null,
    caucusDurationSeconds: number | null,
    voteThreshold: Motion['voteThreshold'],
    voteType: VoteType
  ) => Promise<string>;
  setActiveMotion: (motion: Motion | null) => void;
  resolveMotion: (
    motionId: string,
    sessionId: string,
    status: 'passed' | 'failed' | 'withdrawn',
    forVotes: number,
    againstVotes: number,
    abstentions: number
  ) => Promise<void>;
  getPendingMotions: () => Motion[];
}

export const useMotionStore = create<MotionStore>((set, get) => ({
  motions: [],
  activeMotion: null,
  unsubscribe: null,

  subscribeToMotions: (sessionId) => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
    const unsub = subscribeToSessionMotions(sessionId, (motions) => {
      set({ motions });
    });
    set({ unsubscribe: unsub });
  },

  unsubscribeFromMotions: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null, motions: [], activeMotion: null });
    }
  },

  proposeMotion: async (
    sessionId,
    proposerDelegateId,
    proposerCountry,
    type,
    description,
    speakingTimeSeconds,
    caucusDurationSeconds,
    voteThreshold,
    voteType
  ) => {
    return await proposeMotion(
      sessionId,
      proposerDelegateId,
      proposerCountry,
      type,
      description,
      speakingTimeSeconds,
      caucusDurationSeconds,
      voteThreshold,
      voteType
    );
  },

  setActiveMotion: (motion) => set({ activeMotion: motion }),

  resolveMotion: async (motionId, sessionId, status, forVotes, againstVotes, abstentions) => {
    await updateMotionStatus(motionId, sessionId, status, forVotes, againstVotes, abstentions);
    set({ activeMotion: null });
  },

  getPendingMotions: () => {
    return get().motions.filter((m) => m.status === 'pending' || m.status === 'voting');
  },
}));
