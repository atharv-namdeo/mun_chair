import { 
  collection, addDoc, query, where, onSnapshot, 
  updateDoc, doc, deleteDoc, orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Resolution } from '../../types';
import { logTimelineEvent } from './timeline';

const COL = 'resolutions';

export const subscribeToResolutions = (
  sessionId: string,
  onUpdate: (resolutions: Resolution[]) => void
) => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    onUpdate(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Resolution)));
  });
};

export const createResolution = async (res: Omit<Resolution, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, COL), {
    ...res,
    createdAt: Date.now()
  });
  
  await logTimelineEvent({
    sessionId: res.sessionId,
    type: 'resolution_tabled',
    description: `Resolution ${res.code} "${res.title}" tabled`,
    delegateId: null,
    delegateCountry: null,
    metadata: { resolutionId: docRef.id },
    isUndoable: true
  });
  
  return docRef.id;
};

export const updateResolutionStatus = async (id: string, status: Resolution['status'], sessionId: string) => {
  await updateDoc(doc(db, COL, id), { status });
  
  await logTimelineEvent({
    sessionId,
    type: 'resolution_updated',
    description: `Resolution status changed to ${status.replace('_', ' ')}`,
    delegateId: null,
    delegateCountry: null,
    metadata: { resolutionId: id, status },
    isUndoable: false
  });
};

export const updateResolutionParticipants = async (
  id: string, 
  data: { sponsors?: string[], signatories?: string[] }
) => {
  await updateDoc(doc(db, COL, id), { ...data });
};
