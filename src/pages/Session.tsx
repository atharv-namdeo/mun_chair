import React, { useEffect } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useUIStore } from '../store/uiStore';
import { useTimerStore } from '../store/timerStore';
import { updateSession } from '../lib/firestore/sessions';
import { ActiveSpeech } from '../components/speech/ActiveSpeech';
import { SpeakersList } from '../components/speech/SpeakersList';
import { SpeakerTimer, CaucusTimer, UnmodTimer } from '../components/timer/Timers';
import { PointRaiser } from '../components/points/PointRaiser';
import { MotionPanel } from '../components/points/MotionPanel';
import { TimelinePanel } from '../components/timeline/TimelinePanel';
import { GSLPanel } from '../components/speech/GSLPanel';
import { AttendancePanel } from '../components/delegates/AttendancePanel';
import { DelegateList } from '../components/delegates/DelegateList';
import { AlertTriangle, Settings2 } from 'lucide-react';
import './Session.css';
import '../components/timer/Timers.css';

// Auto-persist timers to Firestore every 5 seconds
let persistInterval: ReturnType<typeof setInterval>;

export const SessionPage: React.FC = () => {
  const { session, updateSession: updateSess } = useSessionStore();
  const { openModal } = useUIStore();
  const { getSerializedTimers } = useTimerStore();

  useEffect(() => {
    if (!session) return;
    persistInterval = setInterval(async () => {
      const timers = getSerializedTimers();
      await updateSess({ timerState: timers });
    }, 5000);
    return () => clearInterval(persistInterval);
  }, [session?.id]);

  if (!session) {
    return (
      <div className="session-no-session">
        <AlertTriangle size={40} color="var(--amber)" />
        <h2>No session open</h2>
        <p>Go to Home and open or create a session</p>
      </div>
    );
  }

  return (
    <div className="session-page">
      {/* Left column: Active speech + queue + caucus timers */}
      <div className="session-col session-col-left">
        <ActiveSpeech />
        <SpeakersList />
        <GSLPanel />
        <AttendancePanel />
        <div className="timers-row">
          <CaucusTimer />
          <UnmodTimer />
        </div>
      </div>

      {/* Center column: Delegate list */}
      <div className="session-col session-col-center">
        <DelegateList />
      </div>

      {/* Right column: Points + Motions + Timeline */}
      <div className="session-col session-col-right">
        <PointRaiser />
        <MotionPanel />
        <TimelinePanel />
      </div>
    </div>
  );
};
