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
import type { Motion, MotionType, VoteType } from '../../types';
import { logTimelineEvent } from './timeline';

const COL = 'motions';

export const proposeMotion = async (
  sessionId: string,
  proposerDelegateId: string,
  proposerCountry: string,
  type: MotionType,
  description: string,
  speakingTimeSeconds: number | null,
  caucusDurationSeconds: number | null,
  voteThreshold: Motion['voteThreshold'],
  voteType: VoteType
): Promise<string> => {
  const now = Date.now();
  const motion: Omit<Motion, 'id'> = {
    sessionId,
    proposerDelegateId,
    proposerCountry,
    type,
    description,
    speakingTimeSeconds,
    caucusDurationSeconds,
    voteThreshold,
    voteType,
    status: 'pending',
    forVotes: 0,
    againstVotes: 0,
    abstentions: 0,
    createdAt: now,
    resolvedAt: null,
  };
  const ref = await addDoc(collection(db, COL), motion);

  const delegateRef = doc(db, 'delegates', proposerDelegateId);
  await updateDoc(delegateRef, {
    motionCount: increment(1),
    updatedAt: Date.now(),
  });

  await logTimelineEvent({
    sessionId,
    type: 'motion_proposed',
    description: `${proposerCountry} proposed: ${description}`,
    delegateId: proposerDelegateId,
    delegateCountry: proposerCountry,
    metadata: { motionId: ref.id, motionType: type },
    isUndoable: true,
  });

  return ref.id;
};

export const updateMotionStatus = async (
  motionId: string,
  sessionId: string,
  status: Motion['status'],
  forVotes: number,
  againstVotes: number,
  abstentions: number
): Promise<void> => {
  const ref = doc(db, COL, motionId);
  await updateDoc(ref, {
    status,
    forVotes,
    againstVotes,
    abstentions,
    resolvedAt: status !== 'pending' && status !== 'voting' ? Date.now() : null,
  });

  await logTimelineEvent({
    sessionId,
    type: `motion_${status}`,
    description: `Motion ${status} — For: ${forVotes}, Against: ${againstVotes}, Abstentions: ${abstentions}`,
    delegateId: null,
    delegateCountry: null,
    metadata: { motionId, status, forVotes, againstVotes, abstentions },
    isUndoable: false,
  });
};

export const subscribeToSessionMotions = (
  sessionId: string,
  callback: (motions: Motion[]) => void
) => {
  const q = query(
    collection(db, COL),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Motion)));
  });
};
