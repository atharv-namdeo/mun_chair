import { create } from 'zustand';
import { subscribeToSession, updateSession, updateTimerState } from '../lib/firestore/sessions';
import type { Session, SerializedTimer, TimerState } from '../types';

interface SessionStore {
  session: Session | null;
  unsubscribe: (() => void) | null;
  setSession: (session: Session | null) => void;
  subscribeToSession: (sessionId: string) => void;
  unsubscribeFromSession: () => void;
  updateSession: (data: Partial<Session>) => Promise<void>;
  persistTimerState: (timerState: Session['timerState']) => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: null,
  unsubscribe: null,

  setSession: (session) => set({ session }),

  subscribeToSession: (sessionId) => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();

    const unsub = subscribeToSession(sessionId, (session) => {
      set({ session });
    });
    set({ unsubscribe: unsub });
  },

  unsubscribeFromSession: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null, session: null });
    }
  },

  updateSession: async (data) => {
    const { session } = get();
    if (!session) return;
    await updateSession(session.id, data);
  },

  persistTimerState: async (timerState) => {
    const { session } = get();
    if (!session) return;
    await updateTimerState(session.id, timerState);
  },
}));
