import React, { useEffect, useState } from 'react';
import { subscribeToAllSessions, createSession } from '../lib/firestore/sessions';
import { useSessionStore } from '../store/sessionStore';
import { useDelegateStore } from '../store/delegateStore';
import { useMotionStore } from '../store/motionStore';
import { useUIStore } from '../store/uiStore';
import { useTimerStore } from '../store/timerStore';
import { useResolutionStore } from '../store/resolutionStore';
import type { Session } from '../types';
import { Plus, X, Zap, Calendar, Users, Clock } from 'lucide-react';
import './Home.css';

export const Home: React.FC = () => {
  const { subscribeToSession, session: activeSession } = useSessionStore();
  const { subscribeToDelegates } = useDelegateStore();
  const { subscribeToMotions } = useMotionStore();
  const { setActivePage, addNotification } = useUIStore();
  const { restoreFromFirestore } = useTimerStore();
  const { subscribeToResolutions } = useResolutionStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: '', committee: '', topic: '', conference: '',
    speakingTimeSeconds: '90', totalSessionSeconds: '7200', totalDelegates: '20',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAllSessions(setSessions);
    return unsub;
  }, []);

  const openSession = (session: Session) => {
    subscribeToSession(session.id);
    subscribeToDelegates(session.id);
    subscribeToMotions(session.id);
    subscribeToResolutions(session.id);
    if (session.timerState) restoreFromFirestore(session.timerState);
    setActivePage('session');
    addNotification(`Opened: ${session.committee}`, 'success');
  };

  const create = async () => {
    if (!form.name || !form.committee) return;
    setLoading(true);
    try {
      const id = await createSession({
        name: form.name, committee: form.committee, topic: form.topic,
        conference: form.conference,
        speakingTimeSeconds: parseInt(form.speakingTimeSeconds),
        totalSessionSeconds: parseInt(form.totalSessionSeconds),
        totalDelegates: parseInt(form.totalDelegates),
      });
      addNotification('Session created!', 'success');
      setShowNew(false);
    } catch {
      addNotification('Failed to create session', 'error');
    }
    setLoading(false);
  };

  const fmt = (ts: number) => new Date(ts).toLocaleDateString();

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-hero-icon"><Zap size={32} /></div>
        <h1 className="home-title">MUN Chair Pro</h1>
        <p className="home-sub">Real-time committee session management for modern MUN chairs</p>
        <button id="btn-new-session" className="btn btn-primary btn-lg" onClick={() => setShowNew(true)}>
          <Plus size={18} /> New Session
        </button>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Session</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowNew(false)}><X size={16} /></button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Session Name *</label>
                <input id="input-session-name" className="input" placeholder="e.g. UNSC Session 1" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Committee *</label>
                <input id="input-committee" className="input" placeholder="e.g. Security Council" value={form.committee} onChange={e => setForm({...form, committee: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Topic</label>
              <input id="input-topic" className="input" placeholder="e.g. The situation in Ukraine" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Conference</label>
                <input id="input-conference" className="input" placeholder="e.g. HMUN 2026" value={form.conference} onChange={e => setForm({...form, conference: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Total Delegates</label>
                <input id="input-total-delegates" className="input" type="number" value={form.totalDelegates} onChange={e => setForm({...form, totalDelegates: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Default Speaking Time (seconds)</label>
                <input id="input-speaking-time" className="input" type="number" value={form.speakingTimeSeconds} onChange={e => setForm({...form, speakingTimeSeconds: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Total Session Length (seconds)</label>
                <input id="input-session-length" className="input" type="number" value={form.totalSessionSeconds} onChange={e => setForm({...form, totalSessionSeconds: e.target.value})} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              <button id="btn-confirm-new-session" className="btn btn-primary" onClick={create} disabled={loading || !form.name || !form.committee}>
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sessions-grid">
        <h2 className="sessions-grid-title">Recent Sessions</h2>
        {sessions.length === 0 && (
          <div className="no-sessions">
            <Calendar size={40} />
            <p>No sessions yet — create your first one above</p>
          </div>
        )}
        <div className="sessions-list">
          {sessions.map(s => (
            <div key={s.id} className="session-card" onClick={() => openSession(s)}>
              <div className="session-card-header">
                <div>
                  <div className="session-card-committee">{s.committee}</div>
                  <div className="session-card-conference">{s.conference}</div>
                </div>
                <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-muted'}`}>
                  {s.status}
                </span>
              </div>
              <div className="session-card-topic">{s.topic}</div>
              <div className="session-card-meta">
                <span className="flex items-center gap-1 text-muted text-sm"><Users size={12} /> {s.totalDelegates} delegates</span>
                <span className="flex items-center gap-1 text-muted text-sm"><Clock size={12} /> {s.speakingTimeSeconds}s/speaker</span>
                <span className="text-muted text-sm">{fmt(s.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
