import React, { useState } from 'react';
import { useMotionStore } from '../../store/motionStore';
import { useDelegateStore } from '../../store/delegateStore';
import { useSessionStore } from '../../store/sessionStore';
import { useUIStore } from '../../store/uiStore';
import { getMotionVoteTally } from '../../lib/firestore/votes';
import type { Motion, MotionType } from '../../types';
import { Vote, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import './MotionPanel.css';

const MOTION_TYPES: { type: MotionType; label: string }[] = [
  { type: 'open_debate',    label: 'Open Debate' },
  { type: 'close_debate',   label: 'Close Debate' },
  { type: 'mod_caucus',     label: 'Moderated Caucus' },
  { type: 'unmod_caucus',   label: 'Unmoderated Caucus' },
  { type: 'recess',         label: 'Recess' },
  { type: 'adjourn',        label: 'Adjourn' },
  { type: 'table',          label: 'Table the Motion' },
  { type: 'extend_time',    label: 'Extend Speaking Time' },
  { type: 'divide_question',label: 'Divide the Question' },
  { type: 'reconsider',     label: 'Reconsider' },
];

export const MotionPanel: React.FC = () => {
  const { motions, proposeMotion, resolveMotion, setActiveMotion } = useMotionStore();
  const { delegates } = useDelegateStore();
  const { session } = useSessionStore();
  const { addNotification } = useUIStore();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    proposerId: '', type: 'mod_caucus' as MotionType,
    desc: '', speakingTime: '60', caucusDuration: '300',
    threshold: 'simple' as Motion['voteThreshold'],
    voteType: 'procedural' as Motion['voteType'],
  });
  const [votingMotionId, setVotingMotionId] = useState<string|null>(null);
  const [votes, setVotes] = useState({ for: 0, against: 0, abstain: 0 });

  const presentDelegates = delegates.filter(d => d.isPresent);
  const pending = motions.filter(m => m.status === 'pending' || m.status === 'voting');

  const submit = async () => {
    if (!session || !form.proposerId) return;
    const proposer = delegates.find(d => d.id === form.proposerId);
    if (!proposer) return;
    const id = await proposeMotion(
      session.id, proposer.id, proposer.country, form.type,
      form.desc || MOTION_TYPES.find(m => m.type === form.type)?.label || '',
      form.type === 'mod_caucus' ? parseInt(form.speakingTime) : null,
      ['mod_caucus','unmod_caucus'].includes(form.type) ? parseInt(form.caucusDuration) : null,
      form.threshold, form.voteType
    );
    addNotification('Motion proposed', 'success');
    setShowForm(false);
  };

  const openVoting = async (motion: Motion) => {
    setVotingMotionId(motion.id);
    const tally = await getMotionVoteTally(motion.id);
    setVotes(tally);
  };

  const resolve = async (status: 'passed' | 'failed') => {
    if (!votingMotionId || !session) return;
    await resolveMotion(votingMotionId, session.id, status, votes.for, votes.against, votes.abstain);
    addNotification(`Motion ${status}`, status === 'passed' ? 'success' : 'error');
    setVotingMotionId(null);
  };

  return (
    <div className="motion-panel-card">
      <div className="section-header">
        <span className="section-title">Motions</span>
        <button id="btn-propose-motion" className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={13} /> Propose
        </button>
      </div>

      {showForm && (
        <div className="motion-form">
          <div className="form-row">
            <div className="form-group">
              <label>Proposer</label>
              <select className="select" value={form.proposerId} onChange={e => setForm({...form, proposerId: e.target.value})}>
                <option value="">— Select —</option>
                {presentDelegates.map(d => <option key={d.id} value={d.id}>{d.country}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Motion Type</label>
              <select className="select" value={form.type} onChange={e => setForm({...form, type: e.target.value as MotionType})}>
                {MOTION_TYPES.map(m => <option key={m.type} value={m.type}>{m.label}</option>)}
              </select>
            </div>
          </div>
          {form.type === 'mod_caucus' && (
            <div className="form-row">
              <div className="form-group">
                <label>Speaking Time (s)</label>
                <input className="input" type="number" value={form.speakingTime} onChange={e => setForm({...form, speakingTime: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Caucus Duration (s)</label>
                <input className="input" type="number" value={form.caucusDuration} onChange={e => setForm({...form, caucusDuration: e.target.value})} />
              </div>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Vote Threshold</label>
              <select className="select" value={form.threshold} onChange={e => setForm({...form, threshold: e.target.value as Motion['voteThreshold']})}>
                <option value="simple">Simple Majority</option>
                <option value="two_thirds">Two-Thirds</option>
                <option value="unanimous">Unanimous</option>
              </select>
            </div>
            <div className="form-group">
              <label>Vote Type</label>
              <select className="select" value={form.voteType} onChange={e => setForm({...form, voteType: e.target.value as Motion['voteType']})}>
                <option value="procedural">Procedural</option>
                <option value="substantive">Substantive</option>
              </select>
            </div>
          </div>
          <div className="modal-actions" style={{borderTop:'none', marginTop: 8, paddingTop: 0}}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button id="btn-submit-motion" className="btn btn-primary btn-sm" onClick={submit}>Submit Motion</button>
          </div>
        </div>
      )}

      <div className="motion-list">
        {pending.length === 0 && <p className="text-muted text-sm" style={{textAlign:'center', padding: '16px 0'}}>No pending motions</p>}
        {pending.map(motion => (
          <div key={motion.id} className="motion-item">
            <div className="motion-item-header">
              <span className="motion-type-badge">{motion.type.replace('_',' ')}</span>
              <span className="text-muted text-sm">{motion.proposerCountry}</span>
            </div>
            <div className="motion-desc">{motion.description}</div>
            {votingMotionId === motion.id ? (
              <div className="voting-controls">
                <div className="vote-inputs">
                  <div className="form-group" style={{marginBottom:0}}>
                    <label>For</label>
                    <input className="input" type="number" min={0} value={votes.for} onChange={e => setVotes({...votes, for: +e.target.value})} style={{width:60}} />
                  </div>
                  <div className="form-group" style={{marginBottom:0}}>
                    <label>Against</label>
                    <input className="input" type="number" min={0} value={votes.against} onChange={e => setVotes({...votes, against: +e.target.value})} style={{width:60}} />
                  </div>
                  <div className="form-group" style={{marginBottom:0}}>
                    <label>Abstain</label>
                    <input className="input" type="number" min={0} value={votes.abstain} onChange={e => setVotes({...votes, abstain: +e.target.value})} style={{width:60}} />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button id={`btn-pass-${motion.id}`} className="btn btn-success btn-sm" onClick={() => resolve('passed')}>
                    <CheckCircle size={13} /> Pass
                  </button>
                  <button id={`btn-fail-${motion.id}`} className="btn btn-danger btn-sm" onClick={() => resolve('failed')}>
                    <XCircle size={13} /> Fail
                  </button>
                </div>
              </div>
            ) : (
              <button id={`btn-vote-${motion.id}`} className="btn btn-ghost btn-sm mt-2" onClick={() => openVoting(motion)}>
                <Vote size={13} /> Call Vote
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
