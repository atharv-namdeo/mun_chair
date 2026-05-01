import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  doc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { TimelineEvent } from '../../types';

const COL = 'timeline';

export const logTimelineEvent = async (
  data: Omit<TimelineEvent, 'id' | 'undoneAt' | 'createdAt'>
): Promise<string> => {
  const event: Omit<TimelineEvent, 'id'> = {
    ...data,
    undoneAt: null,
    createdAt: Date.now(),
  };
  const ref = await addDoc(collection(db, COL), event);
  return ref.id;
};

export const markEventUndone = async (eventId: string): Promise<void> => {
  const ref = doc(db, COL, eventId);
  await updateDoc(ref, { undoneAt: Date.now() });
};

export const subscribeToSessionTimeline = (
  sessionId: string,
  callback: (events: TimelineEvent[]) => void,
  maxEvents = 50
) => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'desc'),
    limit(maxEvents)
  );
  return onSnapshot(q, (snap) => {
    const events = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as TimelineEvent))
      .reverse(); // chronological order
    callback(events);
  });
};

export const getUndoableEvents = async (
  sessionId: string,
  stackSize = 20
): Promise<TimelineEvent[]> => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    where('isUndoable', '==', true),
    where('undoneAt', '==', null),
    orderBy('createdAt', 'desc'),
    limit(stackSize)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TimelineEvent));
};

export const getSessionTimeline = async (
  sessionId: string
): Promise<TimelineEvent[]> => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TimelineEvent));
};
