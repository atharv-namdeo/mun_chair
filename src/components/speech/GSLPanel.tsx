import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useDelegateStore } from '../../store/delegateStore';
import { useSpeechStore } from '../../store/speechStore';
import { useTimerStore } from '../../store/timerStore';
import { updateSession } from '../../lib/firestore/sessions';
import { startSpeech } from '../../lib/firestore/speeches';
import { Users, Play, Pause, RotateCcw, ListOrdered } from 'lucide-react';
import './GSLPanel.css';

export const GSLPanel: React.FC = () => {
  const { session, updateSession: updateSessionStore } = useSessionStore();
  const { delegates, speakerQueue, removeFromQueue } = useDelegateStore();
  const { activeSpeech } = useSpeechStore();
  const { initSpeakerTimer } = useTimerStore();

  const isGSLEnabled = session?.debateMode === 'gsl';

  const toggleGSL = async () => {
    if (!session) return;
    await updateSession(session.id, { 
      debateMode: isGSLEnabled ? 'idle' : 'gsl' 
    });
  };

  const nextSpeaker = async () => {
    if (speakerQueue.length === 0 || !session) return;
    const next = speakerQueue[0];
    await startSpeech(
      session.id,
      next.delegateId,
      next.country,
      session.speakingTimeSeconds,
      1, // caucusRound
      false, // isCrisis
      '', // crisisTag
      'general',
      true
    );
    initSpeakerTimer(session.speakingTimeSeconds);
    removeFromQueue(next.delegateId);
  };

  return (
    <div className={`gsl-panel card ${isGSLEnabled ? 'active' : ''}`}>
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <ListOrdered size={18} className="text-accent" />
          <h3 className="section-title">General Speakers List</h3>
        </div>
        <button 
          className={`btn btn-sm ${isGSLEnabled ? 'btn-danger' : 'btn-primary'}`}
          onClick={toggleGSL}
        >
          {isGSLEnabled ? 'Close GSL' : 'Open GSL'}
        </button>
      </div>

      {isGSLEnabled && (
        <div className="gsl-content">
          <div className="gsl-queue-header">
            <span className="text-sm text-muted">{speakerQueue.length} Speakers in Queue</span>
            {speakerQueue.length > 0 && !activeSpeech && (
              <button className="btn btn-xs btn-primary" onClick={nextSpeaker}>
                Start Next Speaker
              </button>
            )}
          </div>

          <div className="gsl-queue-list scrollbar-hide">
            {speakerQueue.length === 0 ? (
              <div className="empty-queue text-xs text-muted">Queue is empty</div>
            ) : (
              speakerQueue.map((entry, idx) => (
                <div key={entry.delegateId} className="queue-item">
                  <span className="idx">{idx + 1}</span>
                  <span className="country">{entry.country}</span>
                  <button className="btn btn-ghost btn-icon btn-xs" onClick={() => removeFromQueue(entry.delegateId)}>
                    <RotateCcw size={10} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
