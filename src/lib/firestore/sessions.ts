import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Session, SessionSettings, SerializedTimer } from '../../types';

const COL = 'sessions';

const defaultTimer = (): SerializedTimer => ({
  state: 'idle',
  totalSeconds: 0,
  elapsedSeconds: 0,
  lastTickAt: null,
});

const defaultSettings = (): SessionSettings => ({
  engagementWeights: {
    speech: 3,
    poiAsked: 1,
    poiAnswered: 2,
    motion: 1,
    point: 0.5,
    vote: 0.5,
    rightOfReply: 1.5,
  },
  timeEquityThresholdMultiplier: 2.0,
  undoStackSize: 20,
  audioAlertsEnabled: true,
  ambertThresholdPercent: 25,
  redThresholdPercent: 10,
});

export const createSession = async (data: {
  name: string;
  committee: string;
  topic: string;
  conference: string;
  speakingTimeSeconds: number;
  totalSessionSeconds: number;
  totalDelegates: number;
}): Promise<string> => {
  const now = Date.now();
  const sessionData: Omit<Session, 'id'> = {
    ...data,
    status: 'setup',
    caucusType: null,
    sessionStartAt: null,
    quorumCount: 0,
    crisisMode: false,
    crisisTag: '',
    timerState: {
      speakerTimer: defaultTimer(),
      caucusTimer: defaultTimer(),
      unmodTimer: defaultTimer(),
    },
    settings: defaultSettings(),
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, COL), sessionData);
  return ref.id;
};

export const updateSession = async (
  sessionId: string,
  data: Partial<Session>
): Promise<void> => {
  const ref = doc(db, COL, sessionId);
  await updateDoc(ref, { ...data, updatedAt: Date.now() });
};

export const updateTimerState = async (
  sessionId: string,
  timerState: Session['timerState']
): Promise<void> => {
  const ref = doc(db, COL, sessionId);
  await updateDoc(ref, { timerState, updatedAt: Date.now() });
};

export const subscribeToSession = (
  sessionId: string,
  callback: (session: Session | null) => void
) => {
  const ref = doc(db, COL, sessionId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as Session);
    } else {
      callback(null);
    }
  });
};

export const subscribeToAllSessions = (
  callback: (sessions: Session[]) => void
) => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const sessions = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Session)
    );
    callback(sessions);
  });
};

export const getAllSessions = async (): Promise<Session[]> => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));
};

export const updateSessionSettings = async (
  sessionId: string,
  settings: SessionSettings
): Promise<void> => {
  const ref = doc(db, COL, sessionId);
  await updateDoc(ref, { settings, updatedAt: Date.now() });
};
