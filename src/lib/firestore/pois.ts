import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { POI } from '../../types';
import { appendTimelineEvent } from './timeline';

const COL = 'pois';

export const logPOI = async (
  sessionId: string,
  speechId: string,
  askerDelegateId: string,
  askerCountry: string,
  questionText: string,
  wasAllowed: boolean
): Promise<string> => {
  const now = Date.now();
  const poi: Omit<POI, 'id'> = {
    sessionId,
    speechId,
    askerDelegateId,
    askerCountry,
    responderDelegateId: null,
    questionText,
    qualityScore: null,
    replyScore: null,
    wasAllowed,
    createdAt: now,
  };
  const ref = await addDoc(collection(db, COL), poi);

  // Increment delegate's POI asked count
  const delegateRef = doc(db, 'delegates', askerDelegateId);
  await updateDoc(delegateRef, {
    poiAskedCount: increment(1),
    updatedAt: Date.now(),
  });

  await appendTimelineEvent(sessionId, {
    type: 'poi_raised',
    description: `${askerCountry} raised a POI${wasAllowed ? '' : ' (not allowed)'}`,
    delegateId: askerDelegateId,
    delegateCountry: askerCountry,
    metadata: { poiId: ref.id, speechId, wasAllowed, questionText },
    isUndoable: true,
  });

  return ref.id;
};

export const scorePOI = async (
  poiId: string,
  qualityScore: number,
  replyScore: number | null,
  responderDelegateId: string | null
): Promise<void> => {
  const ref = doc(db, COL, poiId);
  await updateDoc(ref, { qualityScore, replyScore, responderDelegateId });

  if (responderDelegateId) {
    const delegateRef = doc(db, 'delegates', responderDelegateId);
    await updateDoc(delegateRef, {
      poiAnsweredCount: increment(1),
      updatedAt: Date.now(),
    });
  }
};

export const subscribeToSpeechPOIs = (
  speechId: string,
  callback: (pois: POI[]) => void
) => {
  const q = query(
    collection(db, COL),
    where('speechId', '==', speechId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as POI)));
  });
};

export const subscribeToSessionPOIs = (
  sessionId: string,
  callback: (pois: POI[]) => void
) => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as POI)));
  });
};
