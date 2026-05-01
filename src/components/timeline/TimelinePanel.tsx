import React, { useEffect, useState } from 'react';
import { subscribeToSessionTimeline } from '../../lib/firestore/timeline';
import { markEventUndone } from '../../lib/firestore/timeline';
import { useSessionStore } from '../../store/sessionStore';
import { useUIStore } from '../../store/uiStore';
import type { TimelineEvent } from '../../types';
import { RotateCcw, Activity } from 'lucide-react';
import './TimelinePanel.css';

const EVENT_COLOR: Record<string, string> = {
  speech_start: 'accent', speech_end: 'accent',
  poi_raised: 'blue', point_raised: 'amber',
  motion_proposed: 'purple', motion_passed: 'green', motion_failed: 'red',
  chair_ruling: 'cyan',
};

const fmt = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const TimelinePanel: React.FC = () => {
  const { session } = useSessionStore();
  const { addNotification } = useUIStore();
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (!session) return;
    const unsub = subscribeToSessionTimeline(session.id, setEvents, 60);
    return unsub;
  }, [session?.id]);

  const undo = async (event: TimelineEvent) => {
    try {
      await markEventUndone(event.id);
      addNotification(`Undid: ${event.description}`, 'info');
    } catch {
      addNotification('Undo failed', 'error');
    }
  };

  return (
    <div className="timeline-panel">
      <div className="section-header">
        <span className="section-title flex items-center gap-2"><Activity size={15} /> Timeline</span>
        <span className="badge badge-muted">{events.length}</span>
      </div>
      <div className="timeline-list">
        {events.length === 0 && (
          <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '20px 0' }}>No events yet</p>
        )}
        {[...events].reverse().map(ev => (
          <div key={ev.id} className={`timeline-event ${ev.undoneAt ? 'undone' : ''}`}>
            <div className={`timeline-dot dot-${EVENT_COLOR[ev.type] || 'muted'}`} />
            <div className="timeline-content">
              <span className="timeline-time mono">{fmt(ev.createdAt)}</span>
              <span className="timeline-desc">{ev.description}</span>
            </div>
            {ev.isUndoable && !ev.undoneAt && (
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => undo(ev)} title="Undo">
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
