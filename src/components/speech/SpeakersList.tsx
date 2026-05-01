import React, { useState } from 'react';
import { useDelegateStore } from '../../store/delegateStore';
import { useSessionStore } from '../../store/sessionStore';
import { useSpeechStore } from '../../store/speechStore';
import { useTimerStore } from '../../store/timerStore';
import { useUIStore } from '../../store/uiStore';
import { startSpeech } from '../../lib/firestore/speeches';
import { X, UserCheck, ChevronUp, ChevronDown, MicVocal } from 'lucide-react';
import type { SpeakerQueueEntry } from '../../types';
import './SpeakersList.css';

export const SpeakersList: React.FC = () => {
  const { speakerQueue, removeFromQueue, reorderQueue, delegates } = useDelegateStore();
  const { session } = useSessionStore();
  const { activeSpeech, setActiveSpeech, caucusRound } = useSpeechStore();
  const { initSpeakerTimer, startSpeakerTimer } = useTimerStore();
  const { addNotification } = useUIStore();

  const callSpeaker = async (entry: SpeakerQueueEntry) => {
    if (!session || activeSpeech) return;
    try {
      const speechId = await startSpeech(
        session.id, entry.delegateId, entry.country,
        session.speakingTimeSeconds, caucusRound,
        session.crisisMode, session.crisisTag
      );
      const speechObj = {
        id: speechId, sessionId: session.id,
        delegateId: entry.delegateId, delegateCountry: entry.country,
        startAt: Date.now(), endAt: null,
        allocatedSeconds: session.speakingTimeSeconds,
        usedSeconds: 0, 
        type: 'general' as const,
        isGSL: false,
        yieldType: 'none' as const,
        yieldedToDelegateId: null,
        isCrisis: session.crisisMode, crisisTag: session.crisisTag,
        caucusRound, 
        metadata: {},
        createdAt: Date.now(),
      };
      setActiveSpeech(speechObj);
      initSpeakerTimer(session.speakingTimeSeconds);
      startSpeakerTimer();
      removeFromQueue(entry.delegateId);
      addNotification(`${entry.country} is now speaking`, 'success');
    } catch (e) {
      addNotification('Failed to start speech', 'error');
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const newQ = [...speakerQueue];
    const target = idx + dir;
    if (target < 0 || target >= newQ.length) return;
    [newQ[idx], newQ[target]] = [newQ[target], newQ[idx]];
    reorderQueue(newQ);
  };

  return (
    <div className="speakers-list-card">
      <div className="section-header">
        <span className="section-title">Speakers Queue</span>
        <span className="badge badge-muted">{speakerQueue.length}</span>
      </div>

      {speakerQueue.length === 0 ? (
        <div className="queue-empty">
          <MicVocal size={24} />
          <p>No speakers queued</p>
        </div>
      ) : (
        <div className="queue-list">
          {speakerQueue.map((entry, idx) => (
            <div key={entry.delegateId} className="queue-item">
              <span className="queue-rank">{idx + 1}</span>
              <div className="queue-country">
                <UserCheck size={13} />
                {entry.country}
              </div>
              <div className="queue-actions">
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => move(idx, -1)} disabled={idx === 0}>
                  <ChevronUp size={13} />
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => move(idx, 1)} disabled={idx === speakerQueue.length - 1}>
                  <ChevronDown size={13} />
                </button>
                <button
                  id={`btn-call-${entry.delegateId}`}
                  className="btn btn-primary btn-sm"
                  onClick={() => callSpeaker(entry)}
                  disabled={!!activeSpeech}
                >
                  Call
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeFromQueue(entry.delegateId)}>
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
