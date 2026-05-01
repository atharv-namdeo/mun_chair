import React from 'react';
import { useSpeechStore } from '../../store/speechStore';
import { useTimerStore } from '../../store/timerStore';
import { useSessionStore } from '../../store/sessionStore';
import { useUIStore } from '../../store/uiStore';
import { endSpeech } from '../../lib/firestore/speeches';
import { SpeakerTimer } from '../timer/Timers';
import { Square, CornerDownRight, AlertTriangle } from 'lucide-react';
import './ActiveSpeech.css';

export const ActiveSpeech: React.FC = () => {
  const { activeSpeech, setActiveSpeech } = useSpeechStore();
  const { speakerTimer, resetSpeakerTimer } = useTimerStore();
  const { session } = useSessionStore();
  const { openModal, addNotification } = useUIStore();

  const stopSpeech = async (yieldType: 'none' | 'chair' | 'delegate' | 'questions' = 'none') => {
    if (!activeSpeech || !session) return;
    try {
      await endSpeech(
        activeSpeech.id, session.id, activeSpeech.delegateId,
        activeSpeech.delegateCountry, speakerTimer.elapsedSeconds,
        yieldType, null
      );
      setActiveSpeech(null);
      resetSpeakerTimer();
      addNotification(`${activeSpeech.delegateCountry} speech ended`, 'info');
    } catch {
      addNotification('Error ending speech', 'error');
    }
  };

  if (!activeSpeech) {
    return (
      <div className="active-speech-empty">
        <div className="speech-empty-icon">🎤</div>
        <p>No speaker active</p>
        <span>Call a delegate from the queue to start</span>
      </div>
    );
  }

  return (
    <div className={`active-speech-card ${session?.crisisMode ? 'crisis' : ''}`}>
      {session?.crisisMode && (
        <div className="crisis-ribbon">
          <AlertTriangle size={13} /> Crisis Speech
        </div>
      )}
      <div className="active-speech-header">
        <div>
          <div className="active-country">{activeSpeech.delegateCountry}</div>
          <div className="active-label">Currently Speaking</div>
        </div>
        <div className="active-actions">
          <button
            id="btn-yield-speech"
            className="btn btn-ghost btn-sm"
            onClick={() => openModal('yield', { speechId: activeSpeech.id })}
          >
            <CornerDownRight size={13} /> Yield
          </button>
          <button
            id="btn-end-speech"
            className="btn btn-danger btn-sm"
            onClick={() => stopSpeech('none')}
          >
            <Square size={13} /> End Speech
          </button>
        </div>
      </div>
      <div className="mt-3">
        <SpeakerTimer />
      </div>
    </div>
  );
};
