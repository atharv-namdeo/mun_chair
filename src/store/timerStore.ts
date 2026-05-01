import { create } from 'zustand';
import type { SerializedTimer, TimerState } from '../types';

// Web Audio API tones for alerts
const playTone = (freq: number, duration: number, volume = 0.3) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio errors
  }
};

export interface TimerData {
  state: TimerState;
  totalSeconds: number;
  elapsedSeconds: number;
  lastTickAt: number | null;
  intervalId: ReturnType<typeof setInterval> | null;
}

interface TimerStore {
  speakerTimer: TimerData;
  caucusTimer: TimerData;
  unmodTimer: TimerData;
  sessionTimer: TimerData;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;

  // Speaker timer
  initSpeakerTimer: (totalSeconds: number) => void;
  startSpeakerTimer: () => void;
  pauseSpeakerTimer: () => void;
  resetSpeakerTimer: () => void;
  getSpeakerUrgency: () => 'normal' | 'amber' | 'red' | 'expired';

  // Caucus timer
  initCaucusTimer: (totalSeconds: number) => void;
  startCaucusTimer: () => void;
  pauseCaucusTimer: () => void;
  resetCaucusTimer: () => void;

  // Unmod timer
  initUnmodTimer: (totalSeconds: number) => void;
  startUnmodTimer: () => void;
  pauseUnmodTimer: () => void;
  resetUnmodTimer: () => void;

  // Session timer
  startSessionTimer: () => void;
  pauseSessionTimer: () => void;
  resetSessionTimer: () => void;

  // Serialization for Firestore persistence
  getSerializedTimers: () => {
    speakerTimer: SerializedTimer;
    caucusTimer: SerializedTimer;
    unmodTimer: SerializedTimer;
  };
  restoreFromFirestore: (data: {
    speakerTimer: SerializedTimer;
    caucusTimer: SerializedTimer;
    unmodTimer: SerializedTimer;
  }) => void;
}

const defaultTimer = (): TimerData => ({
  state: 'idle',
  totalSeconds: 0,
  elapsedSeconds: 0,
  lastTickAt: null,
  intervalId: null,
});

export const useTimerStore = create<TimerStore>((set, get) => ({
  speakerTimer: defaultTimer(),
  caucusTimer: defaultTimer(),
  unmodTimer: defaultTimer(),
  sessionTimer: { ...defaultTimer(), state: 'idle' },
  audioEnabled: true,

  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),

  // ─── Speaker Timer ───────────────────────────────────────
  initSpeakerTimer: (totalSeconds) =>
    set({ speakerTimer: { ...defaultTimer(), totalSeconds } }),

  startSpeakerTimer: () => {
    const { speakerTimer } = get();
    if (speakerTimer.state === 'running') return;
    if (speakerTimer.intervalId) clearInterval(speakerTimer.intervalId);

    const id = setInterval(() => {
      const { speakerTimer: t, audioEnabled: aud } = get();
      const next = Math.min(t.elapsedSeconds + 1, t.totalSeconds);
      const remaining = t.totalSeconds - next;

      if (remaining <= 0 && aud) {
        playTone(440, 0.5);
        setTimeout(() => playTone(330, 0.8), 600);
      } else if (remaining === 10 && aud) {
        playTone(660, 0.3);
      } else if (remaining === 30 && aud) {
        playTone(550, 0.2);
      }

      set((state) => ({
        speakerTimer: {
          ...state.speakerTimer,
          elapsedSeconds: next,
          lastTickAt: Date.now(),
          state: remaining <= 0 ? 'expired' : 'running',
          intervalId: remaining <= 0 ? null : state.speakerTimer.intervalId,
        },
      }));

      if (remaining <= 0) clearInterval(id);
    }, 1000);

    set({ speakerTimer: { ...speakerTimer, state: 'running', intervalId: id, lastTickAt: Date.now() } });
  },

  pauseSpeakerTimer: () => {
    const { speakerTimer } = get();
    if (speakerTimer.intervalId) clearInterval(speakerTimer.intervalId);
    set({ speakerTimer: { ...speakerTimer, state: 'paused', intervalId: null } });
  },

  resetSpeakerTimer: () => {
    const { speakerTimer } = get();
    if (speakerTimer.intervalId) clearInterval(speakerTimer.intervalId);
    set({ speakerTimer: { ...speakerTimer, state: 'idle', elapsedSeconds: 0, intervalId: null } });
  },

  getSpeakerUrgency: () => {
    const { speakerTimer } = get();
    if (speakerTimer.totalSeconds === 0) return 'normal';
    const remaining = speakerTimer.totalSeconds - speakerTimer.elapsedSeconds;
    const pct = (remaining / speakerTimer.totalSeconds) * 100;
    if (speakerTimer.state === 'expired') return 'expired';
    if (pct <= 10) return 'red';
    if (pct <= 25) return 'amber';
    return 'normal';
  },

  // ─── Caucus Timer ────────────────────────────────────────
  initCaucusTimer: (totalSeconds) =>
    set({ caucusTimer: { ...defaultTimer(), totalSeconds } }),

  startCaucusTimer: () => {
    const { caucusTimer } = get();
    if (caucusTimer.state === 'running') return;
    if (caucusTimer.intervalId) clearInterval(caucusTimer.intervalId);

    const id = setInterval(() => {
      const { caucusTimer: t, audioEnabled: aud } = get();
      const next = Math.min(t.elapsedSeconds + 1, t.totalSeconds);
      const remaining = t.totalSeconds - next;

      if (remaining <= 0 && aud) playTone(440, 0.5);

      set((state) => ({
        caucusTimer: {
          ...state.caucusTimer,
          elapsedSeconds: next,
          lastTickAt: Date.now(),
          state: remaining <= 0 ? 'expired' : 'running',
          intervalId: remaining <= 0 ? null : state.caucusTimer.intervalId,
        },
      }));

      if (remaining <= 0) clearInterval(id);
    }, 1000);

    set({ caucusTimer: { ...caucusTimer, state: 'running', intervalId: id, lastTickAt: Date.now() } });
  },

  pauseCaucusTimer: () => {
    const { caucusTimer } = get();
    if (caucusTimer.intervalId) clearInterval(caucusTimer.intervalId);
    set({ caucusTimer: { ...caucusTimer, state: 'paused', intervalId: null } });
  },

  resetCaucusTimer: () => {
    const { caucusTimer } = get();
    if (caucusTimer.intervalId) clearInterval(caucusTimer.intervalId);
    set({ caucusTimer: { ...caucusTimer, state: 'idle', elapsedSeconds: 0, intervalId: null } });
  },

  // ─── Unmod Timer ─────────────────────────────────────────
  initUnmodTimer: (totalSeconds) =>
    set({ unmodTimer: { ...defaultTimer(), totalSeconds } }),

  startUnmodTimer: () => {
    const { unmodTimer } = get();
    if (unmodTimer.state === 'running') return;
    if (unmodTimer.intervalId) clearInterval(unmodTimer.intervalId);

    const id = setInterval(() => {
      const { unmodTimer: t, audioEnabled: aud } = get();
      const next = Math.min(t.elapsedSeconds + 1, t.totalSeconds);
      const remaining = t.totalSeconds - next;
      if (remaining <= 0 && aud) playTone(440, 0.5);
      set((state) => ({
        unmodTimer: {
          ...state.unmodTimer,
          elapsedSeconds: next,
          lastTickAt: Date.now(),
          state: remaining <= 0 ? 'expired' : 'running',
          intervalId: remaining <= 0 ? null : state.unmodTimer.intervalId,
        },
      }));
      if (remaining <= 0) clearInterval(id);
    }, 1000);

    set({ unmodTimer: { ...unmodTimer, state: 'running', intervalId: id, lastTickAt: Date.now() } });
  },

  pauseUnmodTimer: () => {
    const { unmodTimer } = get();
    if (unmodTimer.intervalId) clearInterval(unmodTimer.intervalId);
    set({ unmodTimer: { ...unmodTimer, state: 'paused', intervalId: null } });
  },

  resetUnmodTimer: () => {
    const { unmodTimer } = get();
    if (unmodTimer.intervalId) clearInterval(unmodTimer.intervalId);
    set({ unmodTimer: { ...unmodTimer, state: 'idle', elapsedSeconds: 0, intervalId: null } });
  },

  // ─── Session Timer ───────────────────────────────────────
  startSessionTimer: () => {
    const { sessionTimer } = get();
    if (sessionTimer.state === 'running') return;
    if (sessionTimer.intervalId) clearInterval(sessionTimer.intervalId);

    const id = setInterval(() => {
      set((state) => ({
        sessionTimer: {
          ...state.sessionTimer,
          elapsedSeconds: state.sessionTimer.elapsedSeconds + 1,
          lastTickAt: Date.now(),
        },
      }));
    }, 1000);

    set({ sessionTimer: { ...sessionTimer, state: 'running', intervalId: id } });
  },

  pauseSessionTimer: () => {
    const { sessionTimer } = get();
    if (sessionTimer.intervalId) clearInterval(sessionTimer.intervalId);
    set({ sessionTimer: { ...sessionTimer, state: 'paused', intervalId: null } });
  },

  resetSessionTimer: () => {
    const { sessionTimer } = get();
    if (sessionTimer.intervalId) clearInterval(sessionTimer.intervalId);
    set({ sessionTimer: { ...sessionTimer, state: 'idle', elapsedSeconds: 0, intervalId: null } });
  },

  // ─── Serialization ───────────────────────────────────────
  getSerializedTimers: () => {
    const { speakerTimer, caucusTimer, unmodTimer } = get();
    const serialize = (t: TimerData): SerializedTimer => ({
      state: t.state,
      totalSeconds: t.totalSeconds,
      elapsedSeconds: t.elapsedSeconds,
      lastTickAt: t.lastTickAt,
    });
    return {
      speakerTimer: serialize(speakerTimer),
      caucusTimer: serialize(caucusTimer),
      unmodTimer: serialize(unmodTimer),
    };
  },

  restoreFromFirestore: (data) => {
    const restore = (s: SerializedTimer): TimerData => ({
      state: s.state === 'running' ? 'paused' : s.state, // Don't auto-resume on restore
      totalSeconds: s.totalSeconds,
      elapsedSeconds: s.elapsedSeconds,
      lastTickAt: s.lastTickAt,
      intervalId: null,
    });
    set({
      speakerTimer: restore(data.speakerTimer),
      caucusTimer: restore(data.caucusTimer),
      unmodTimer: restore(data.unmodTimer),
    });
  },
}));
