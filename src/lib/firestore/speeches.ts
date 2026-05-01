import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Speech, YieldType } from '../../types';
import { updateDelegate } from './delegates';
import { logTimelineEvent } from './timeline';

const COL = 'speeches';

export const startSpeech = async (
  sessionId: string,
  delegateId: string,
  delegateCountry: string,
  allocatedSeconds: number,
  caucusRound: number,
  isCrisis: boolean,
  crisisTag: string,
  type: 'general' | 'mod' | 'comment' | 'procedural' = 'general',
  isGSL: boolean = false
): Promise<string> => {
  const now = Date.now();
  const speech: Omit<Speech, 'id'> = {
    sessionId,
    delegateId,
    delegateCountry,
    startAt: now,
    endAt: null,
    allocatedSeconds,
    usedSeconds: 0,
    type,
    isGSL,
    yieldType: 'none',
    yieldedToDelegateId: null,
    isCrisis,
    crisisTag,
    caucusRound,
    metadata: {},
    createdAt: now,
  };
  const ref = await addDoc(collection(db, COL), speech);
  await logTimelineEvent({
    sessionId,
    type: 'speech_start',
    description: `${delegateCountry} began speaking`,
    delegateId,
    delegateCountry,
    metadata: { speechId: ref.id, allocatedSeconds },
    isUndoable: true,
  });
  return ref.id;
};

export const endSpeech = async (
  speechId: string,
  sessionId: string,
  delegateId: string,
  delegateCountry: string,
  usedSeconds: number,
  yieldType: YieldType,
  yieldedToDelegateId: string | null
): Promise<void> => {
  const ref = doc(db, COL, speechId);
  await updateDoc(ref, {
    endAt: Date.now(),
    usedSeconds,
    yieldType,
    yieldedToDelegateId,
  });

  // Update delegate stats
  await updateDelegate(delegateId, {
    totalSpeechSeconds: undefined, // will be accumulated server-side via increment below
    speechCount: undefined,
  });

  // Use Firestore increment for atomic counter updates
  const { increment } = await import('firebase/firestore');
  const delegateRef = doc(db, 'delegates', delegateId);
  await updateDoc(delegateRef, {
    speechCount: increment(1),
    totalSpeechSeconds: increment(usedSeconds),
    updatedAt: Date.now(),
  });

  await logTimelineEvent({
    sessionId,
    type: 'speech_end',
    description: `${delegateCountry} finished speaking (${usedSeconds}s used, yield: ${yieldType})`,
    delegateId,
    delegateCountry,
    metadata: { speechId, usedSeconds, yieldType, yieldedToDelegateId },
    isUndoable: false,
  });
};

export const subscribeToSessionSpeeches = (
  sessionId: string,
  callback: (speeches: Speech[]) => void
) => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const speeches = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Speech));
    callback(speeches);
  });
};

export const getSessionSpeeches = async (sessionId: string): Promise<Speech[]> => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Speech));
};
