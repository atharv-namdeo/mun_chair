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
import type { Point, PointType, ChairRuling } from '../../types';
import { logTimelineEvent } from './timeline';

const COL = 'points';

export const raisePoint = async (
  sessionId: string,
  delegateId: string,
  delegateCountry: string,
  type: PointType,
  questionText: string,
  linkedSpeechId: string | null,
  isProcedural: boolean = false,
  chairRemarks: string = '',
  ruleViolated: string | null = null,
  targetDelegateId: string | null = null,
  targetCountry: string | null = null
): Promise<string> => {
  const now = Date.now();
  const point: Omit<Point, 'id'> = {
    sessionId,
    delegateId,
    delegateCountry,
    type,
    questionText,
    chairRuling: 'pending',
    chairRemarks,
    isProcedural,
    ruleViolated,
    targetDelegateId,
    targetCountry,
    didPauseTimer: isProcedural,
    linkedSpeechId,
    createdAt: now,
  };
  const ref = await addDoc(collection(db, COL), point);

  const delegateRef = doc(db, 'delegates', delegateId);
  await updateDoc(delegateRef, {
    pointCount: increment(1),
    updatedAt: Date.now(),
  });

  // Trigger auto-recalc of engagement score
  const { getDoc } = await import('firebase/firestore');
  const updatedSnap = await getDoc(delegateRef);
  if (updatedSnap.exists()) {
    const delegate = { id: delegateId, ...updatedSnap.data() } as any;
    const { session } = (await import('../../store/sessionStore')).useSessionStore.getState();
    if (session?.settings.engagementWeights) {
      await (await import('./delegates')).recalculateEngagementScore(delegateId, delegate, session.settings.engagementWeights);
    }
  }

  await logTimelineEvent({
    sessionId,
    type: 'point_raised',
    description: `${delegateCountry} raised a ${type}`,
    delegateId,
    delegateCountry,
    metadata: { pointId: ref.id, pointType: type, questionText },
    isUndoable: true,
  });

  return ref.id;
};

export const applyChairRuling = async (
  pointId: string,
  sessionId: string,
  ruling: ChairRuling,
  remarks: string,
  delegateCountry: string
): Promise<void> => {
  const ref = doc(db, COL, pointId);
  await updateDoc(ref, { chairRuling: ruling, chairRemarks: remarks });

  await logTimelineEvent({
    sessionId,
    type: 'chair_ruling',
    description: `Chair ruled ${ruling} on point by ${delegateCountry}${remarks ? ': ' + remarks : ''}`,
    delegateId: null,
    delegateCountry,
    metadata: { pointId, ruling, remarks },
    isUndoable: false,
  });
};

export const subscribeToSessionPoints = (
  sessionId: string,
  callback: (points: Point[]) => void
) => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Point)));
  });
};
