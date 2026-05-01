import React from 'react';
import { useTimerStore } from '../../store/timerStore';
import { Play, Pause, RotateCcw } from 'lucide-react';

const fmt = (total: number, elapsed: number) => {
  const rem = Math.max(0, total - elapsed);
  const m = Math.floor(rem / 60);
  const s = rem % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

export const SpeakerTimer: React.FC = () => {
  const {
    speakerTimer, startSpeakerTimer, pauseSpeakerTimer,
    resetSpeakerTimer, getSpeakerUrgency
  } = useTimerStore();

  const urgency = getSpeakerUrgency();
  const pct = speakerTimer.totalSeconds > 0
    ? Math.min(100, (speakerTimer.elapsedSeconds / speakerTimer.totalSeconds) * 100)
    : 0;

  return (
    <div className="speaker-timer-card">
      <div className="timer-label">Speaker Timer</div>
      <div className={`timer-display ${urgency}`}>
        {fmt(speakerTimer.totalSeconds, speakerTimer.elapsedSeconds)}
      </div>
      <div className="progress-bar mt-2">
        <div className={`progress-fill ${urgency}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="timer-controls mt-3">
        {speakerTimer.state !== 'running' ? (
          <button
            id="btn-speaker-start"
            className="btn btn-primary btn-sm"
            onClick={startSpeakerTimer}
            disabled={speakerTimer.totalSeconds === 0}
          >
            <Play size={13} /> Start
          </button>
        ) : (
          <button id="btn-speaker-pause" className="btn btn-secondary btn-sm" onClick={pauseSpeakerTimer}>
            <Pause size={13} /> Pause
          </button>
        )}
        <button id="btn-speaker-reset" className="btn btn-ghost btn-sm" onClick={resetSpeakerTimer}>
          <RotateCcw size={13} /> Reset
        </button>
      </div>
    </div>
  );
};

export const CaucusTimer: React.FC = () => {
  const { caucusTimer, startCaucusTimer, pauseCaucusTimer, resetCaucusTimer } = useTimerStore();
  const elapsed = caucusTimer.elapsedSeconds;
  const total = caucusTimer.totalSeconds;
  const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
  const urgency = pct >= 90 ? 'red' : pct >= 75 ? 'amber' : 'normal';

  return (
    <div className="caucus-timer-card">
      <div className="timer-label">Caucus Block</div>
      <div className={`timer-display ${urgency}`} style={{ fontSize: '2rem' }}>
        {fmt(total, elapsed)}
      </div>
      <div className="progress-bar mt-2">
        <div className={`progress-fill ${urgency}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="timer-controls mt-2">
        {caucusTimer.state !== 'running' ? (
          <button id="btn-caucus-start" className="btn btn-primary btn-sm" onClick={startCaucusTimer} disabled={total === 0}>
            <Play size={13} /> Start
          </button>
        ) : (
          <button id="btn-caucus-pause" className="btn btn-secondary btn-sm" onClick={pauseCaucusTimer}>
            <Pause size={13} /> Pause
          </button>
        )}
        <button id="btn-caucus-reset" className="btn btn-ghost btn-sm" onClick={resetCaucusTimer}>
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
};

export const UnmodTimer: React.FC = () => {
  const { unmodTimer, startUnmodTimer, pauseUnmodTimer, resetUnmodTimer } = useTimerStore();
  const pct = unmodTimer.totalSeconds > 0
    ? Math.min(100, (unmodTimer.elapsedSeconds / unmodTimer.totalSeconds) * 100) : 0;
  const urgency = pct >= 90 ? 'red' : pct >= 75 ? 'amber' : 'normal';

  return (
    <div className="unmod-timer-card">
      <div className="timer-label">Unmoderated Caucus</div>
      <div className={`timer-display ${urgency}`} style={{ fontSize: '2rem' }}>
        {fmt(unmodTimer.totalSeconds, unmodTimer.elapsedSeconds)}
      </div>
      <div className="progress-bar mt-2">
        <div className={`progress-fill ${urgency}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="timer-controls mt-2">
        {unmodTimer.state !== 'running' ? (
          <button id="btn-unmod-start" className="btn btn-success btn-sm" onClick={startUnmodTimer} disabled={unmodTimer.totalSeconds === 0}>
            <Play size={13} /> Start
          </button>
        ) : (
          <button id="btn-unmod-pause" className="btn btn-secondary btn-sm" onClick={pauseUnmodTimer}>
            <Pause size={13} /> Pause
          </button>
        )}
        <button id="btn-unmod-reset" className="btn btn-ghost btn-sm" onClick={resetUnmodTimer}>
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
};
