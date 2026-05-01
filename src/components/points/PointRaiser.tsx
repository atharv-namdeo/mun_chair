import React, { useState } from 'react';
import { useDelegateStore } from '../../store/delegateStore';
import { useSpeechStore } from '../../store/speechStore';
import { useSessionStore } from '../../store/sessionStore';
import { useUIStore } from '../../store/uiStore';
import { raisePoint } from '../../lib/firestore/points';
import { logPOI } from '../../lib/firestore/pois';
import type { PointType } from '../../types';
import './PointRaiser.css';

const POINT_CONFIG: { type: PointType; label: string; short: string; color: string; desc: string }[] = [
  { type: 'POI', label: 'Point of Information', short: 'POI', color: 'accent', desc: 'Question to the speaker' },
  { type: 'POO', label: 'Point of Order', short: 'POO', color: 'amber', desc: 'Procedural violation' },
  { type: 'PPP', label: 'Personal Privilege', short: 'PPP', color: 'green', desc: 'Comfort / personal issue' },
  { type: 'PI',  label: 'Parliamentary Inquiry', short: 'PI', color: 'blue', desc: 'Procedure question' },
  { type: 'RoR', label: 'Right of Reply', short: 'RoR', color: 'purple', desc: 'Reply to personal attack' },
];

export const PointRaiser: React.FC = () => {
  const { delegates } = useDelegateStore();
  const { activeSpeech } = useSpeechStore();
  const { session } = useSessionStore();
  const { addNotification } = useUIStore();
  const [isProcedural, setIsProcedural] = useState(false);
  const [chairRemarks, setChairRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const presentDelegates = delegates.filter(d => d.isPresent);

  const handlePoint = async (type: PointType) => {
    if (!session || !selectedDelegate) {
      addNotification('Select a delegate first', 'warning');
      return;
    }
    const delegate = delegates.find(d => d.id === selectedDelegate);
    if (!delegate) return;
    setLoading(true);
    try {
      if (type === 'POI' && activeSpeech) {
        await logPOI(
          session.id, activeSpeech.id, delegate.id,
          delegate.country, questionText, true
        );
      } else {
        await raisePoint(
          session.id, delegate.id, delegate.country,
          type, questionText, activeSpeech?.id || null,
          isProcedural, chairRemarks
        );
      }
      addNotification(`${type} raised by ${delegate.country}`, 'info');
      setQuestionText('');
      setChairRemarks('');
    } catch {
      addNotification('Failed to log point', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="point-raiser-card">
      <div className="section-header">
        <span className="section-title">Raise a Point</span>
      </div>

      <div className="point-form-grid">
        <div className="form-group">
          <label htmlFor="point-delegate">Delegate</label>
          <select
            id="point-delegate"
            className="select"
            value={selectedDelegate}
            onChange={e => setSelectedDelegate(e.target.value)}
          >
            <option value="">— Select delegate —</option>
            {presentDelegates.map(d => (
              <option key={d.id} value={d.id}>{d.country}</option>
            ))}
          </select>
        </div>

        <div className="form-group flex items-end pb-1">
          <label className="checkbox-container text-xs">
            <input 
              type="checkbox" 
              checked={isProcedural} 
              onChange={e => setIsProcedural(e.target.checked)} 
            />
            <span className="checkmark"></span>
            Procedural / Rule Claim
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="point-question">Question / Claim Text (POI/POO)</label>
        <input
          id="point-question"
          className="input"
          placeholder="Enter question or procedure violated..."
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="point-remarks">Chair Remarks / Ruling Rationale</label>
        <input
          id="point-remarks"
          className="input"
          placeholder="Optional chair remarks..."
          value={chairRemarks}
          onChange={e => setChairRemarks(e.target.value)}
        />
      </div>

      <div className="point-buttons">
        {POINT_CONFIG.map(({ type, label, short, color, desc }) => (
          <button
            key={type}
            id={`btn-point-${type.toLowerCase()}`}
            className={`point-btn point-btn--${color}`}
            onClick={() => handlePoint(type)}
            disabled={loading || !selectedDelegate}
            title={label}
          >
            <span className="point-short">{short}</span>
            <span className="point-desc">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
