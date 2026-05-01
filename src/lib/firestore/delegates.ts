import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Delegate, EngagementWeights } from '../../types';

const COL = 'delegates';

export const addDelegate = async (
  sessionId: string,
  data: { country: string; delegateName: string; bloc: string }
): Promise<string> => {
  const now = Date.now();
  const delegate: Omit<Delegate, 'id'> = {
    sessionId,
    country: data.country,
    delegateName: data.delegateName,
    bloc: data.bloc,
    isPresent: true,
    isDeleted: false,
    totalSpeechSeconds: 0,
    speechCount: 0,
    poiAskedCount: 0,
    poiAnsweredCount: 0,
    motionCount: 0,
    pointCount: 0,
    voteCount: 0,
    rightOfReplyCount: 0,
    engagementScore: 0,
    presenceStatus: 'present',
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, COL), delegate);
  return ref.id;
};

export const bulkImportDelegates = async (
  sessionId: string,
  rows: { country: string; delegateName: string; bloc: string }[]
): Promise<void> => {
  const batch = writeBatch(db);
  const now = Date.now();
  rows.forEach((row) => {
    const ref = doc(collection(db, COL));
    const delegate: Omit<Delegate, 'id'> = {
      sessionId,
      country: row.country,
      delegateName: row.delegateName || '',
      bloc: row.bloc || '',
      isPresent: true,
      isDeleted: false,
      totalSpeechSeconds: 0,
      speechCount: 0,
      poiAskedCount: 0,
      poiAnsweredCount: 0,
      motionCount: 0,
      pointCount: 0,
      voteCount: 0,
      rightOfReplyCount: 0,
      engagementScore: 0,
      presenceStatus: 'present',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    batch.set(ref, delegate);
  });
  await batch.commit();
};

export const updateDelegate = async (
  delegateId: string,
  data: Partial<Delegate>
): Promise<void> => {
  const ref = doc(db, COL, delegateId);
  await updateDoc(ref, { ...data, updatedAt: Date.now() });
};

export const softDeleteDelegate = async (delegateId: string): Promise<void> => {
  const ref = doc(db, COL, delegateId);
  await updateDoc(ref, { isDeleted: true, updatedAt: Date.now() });
};

export const recalculateEngagementScore = async (
  delegateId: string,
  delegate: Delegate,
  weights: EngagementWeights
): Promise<void> => {
  const score =
    delegate.speechCount * weights.speech +
    delegate.poiAskedCount * weights.poiAsked +
    delegate.poiAnsweredCount * weights.poiAnswered +
    delegate.motionCount * weights.motion +
    delegate.pointCount * weights.point +
    delegate.voteCount * weights.vote +
    delegate.rightOfReplyCount * weights.rightOfReply;
  await updateDelegate(delegateId, { engagementScore: Math.round(score * 10) / 10 });
};

export const subscribeToSessionDelegates = (
  sessionId: string,
  callback: (delegates: Delegate[]) => void
) => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    orderBy('country', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const delegates = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Delegate))
      .filter((d) => !d.isDeleted);
    callback(delegates);
  });
};

export const getSessionDelegates = async (
  sessionId: string
): Promise<Delegate[]> => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    orderBy('country', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Delegate))
    .filter((d) => !d.isDeleted);
};

export const updateDelegatePresence = async (
  delegateId: string,
  status: 'present' | 'present_and_voting' | 'absent'
): Promise<void> => {
  const ref = doc(db, COL, delegateId);
  await updateDoc(ref, { 
    presenceStatus: status, 
    isPresent: status !== 'absent',
    updatedAt: Date.now() 
  });
};
