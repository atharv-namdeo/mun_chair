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
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Vote } from '../../types';
import { appendTimelineEvent } from './timeline';

const COL = 'votes';

export const recordVote = async (
  sessionId: string,
  motionId: string,
  delegateId: string,
  delegateCountry: string,
  vote: Vote['vote']
): Promise<string> => {
  const now = Date.now();
  const voteDoc: Omit<Vote, 'id'> = {
    sessionId,
    motionId,
    delegateId,
    delegateCountry,
    vote,
    createdAt: now,
  };
  const ref = await addDoc(collection(db, COL), voteDoc);

  const delegateRef = doc(db, 'delegates', delegateId);
  await updateDoc(delegateRef, {
    voteCount: increment(1),
    updatedAt: Date.now(),
  });

  return ref.id;
};

export const getMotionVoteTally = async (
  motionId: string
): Promise<{ for: number; against: number; abstain: number }> => {
  const q = query(collection(db, COL), where('motionId', '==', motionId));
  const snap = await getDocs(q);
  const tally = { for: 0, against: 0, abstain: 0 };
  snap.docs.forEach((d) => {
    const v = d.data() as Vote;
    if (v.vote === 'for') tally.for++;
    else if (v.vote === 'against') tally.against++;
    else tally.abstain++;
  });
  return tally;
};

export const subscribeToMotionVotes = (
  motionId: string,
  callback: (votes: Vote[]) => void
) => {
  const q = query(
    collection(db, COL),
    where('motionId', '==', motionId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vote)));
  });
};

export const subscribeToSessionVotes = (
  sessionId: string,
  callback: (votes: Vote[]) => void
) => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vote)));
  });
};
