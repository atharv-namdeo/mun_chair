import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useUIStore } from '../../store/uiStore';
import { useTimerStore } from '../../store/timerStore';
import { updateSession } from '../../lib/firestore/sessions';
import { AlertTriangle, Zap, Shield, Clock } from 'lucide-react';
import './Header.css';

const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

export const Header: React.FC = () => {
  const { session, updateSession: updateSess } = useSessionStore();
  const { addNotification } = useUIStore();
  const { sessionTimer, startSessionTimer, pauseSessionTimer } = useTimerStore();

  const toggleCrisis = async () => {
    if (!session) return;
    await updateSess({ crisisMode: !session.crisisMode });
    addNotification(
      session.crisisMode ? 'Crisis mode deactivated' : '⚠️ Crisis mode activated',
      session.crisisMode ? 'info' : 'warning'
    );
  };

  const quorumPct = session ? Math.round((session.quorumCount / Math.max(session.totalDelegates, 1)) * 100) : 0;
  const hasQuorum = quorumPct >= 50;

  return (
    <header className="app-header">
      <div className="header-left">
        {session ? (
          <>
            <div className="header-session-info">
              <span className="header-committee">{session.committee}</span>
              <span className="header-sep">·</span>
              <span className="header-topic">{session.topic}</span>
            </div>
            <div
              className={`quorum-badge ${hasQuorum ? 'quorum-ok' : 'quorum-low'}`}
              title="Quorum status"
            >
              <Shield size={12} />
              {session.quorumCount}/{session.totalDelegates} ({quorumPct}%)
            </div>
          </>
        ) : (
          <span className="header-no-session">No active session</span>
        )}
      </div>

      <div className="header-center">
        {session && (
          <div className="session-clock" onClick={() =>
            sessionTimer.state === 'running' ? pauseSessionTimer() : startSessionTimer()
          }>
            <Clock size={13} />
            <span className="mono">{formatTime(sessionTimer.elapsedSeconds)}</span>
          </div>
        )}
      </div>

      <div className="header-right">
        {session && (
          <button
            id="btn-crisis-mode"
            className={`btn btn-sm ${session.crisisMode ? 'btn-danger' : 'btn-ghost'}`}
            onClick={toggleCrisis}
          >
            <AlertTriangle size={14} />
            {session.crisisMode ? 'Crisis Active' : 'Crisis Mode'}
          </button>
        )}
        <div className={`status-dot ${session?.status === 'active' ? 'dot-active' : 'dot-idle'}`} />
      </div>
    </header>
  );
};
