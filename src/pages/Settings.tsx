import React, { useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useUIStore } from '../store/uiStore';
import { useTimerStore } from '../store/timerStore';
import { updateSessionSettings } from '../lib/firestore/sessions';
import type { SessionSettings } from '../types';
import { Save, Volume2, VolumeX } from 'lucide-react';
import './Settings.css';

export const Settings: React.FC = () => {
  const { session, updateSession } = useSessionStore();
  const { addNotification } = useUIStore();
  const { audioEnabled, setAudioEnabled } = useTimerStore();
  const [settings, setSettings] = useState<SessionSettings | null>(session?.settings || null);
  const [speakingTime, setSpeakingTime] = useState(session?.speakingTimeSeconds ?? 90);
  const [saving, setSaving] = useState(false);

  if (!session || !settings) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Open a session first to configure settings
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await updateSessionSettings(session.id, settings);
      await updateSession({ speakingTimeSeconds: speakingTime });
      addNotification('Settings saved', 'success');
    } catch {
      addNotification('Failed to save settings', 'error');
    }
    setSaving(false);
  };

  const setWeight = (key: keyof typeof settings.engagementWeights, val: number) => {
    setSettings(s => s ? {
      ...s, engagementWeights: { ...s.engagementWeights, [key]: val }
    } : s);
  };

  return (
    <div className="settings-page">
      <h1 className="text-xl font-bold mb-4">Session Settings</h1>

      <div className="settings-section">
        <h2 className="section-title mb-3">Timer Defaults</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Default Speaking Time (seconds)</label>
            <input className="input" type="number" min={10} max={600}
              value={speakingTime} onChange={e => setSpeakingTime(+e.target.value)} />
          </div>
          <div className="form-group">
            <label>Time Equity Warning (× avg)</label>
            <input className="input" type="number" step={0.1} min={1} max={10}
              value={settings.timeEquityThresholdMultiplier}
              onChange={e => setSettings(s => s ? {...s, timeEquityThresholdMultiplier: +e.target.value} : s)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Amber Threshold (% time left)</label>
            <input className="input" type="number" min={1} max={90}
              value={settings.ambertThresholdPercent}
              onChange={e => setSettings(s => s ? {...s, ambertThresholdPercent: +e.target.value} : s)} />
          </div>
          <div className="form-group">
            <label>Red Threshold (% time left)</label>
            <input className="input" type="number" min={1} max={50}
              value={settings.redThresholdPercent}
              onChange={e => setSettings(s => s ? {...s, redThresholdPercent: +e.target.value} : s)} />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title mb-3">Engagement Score Weights</h2>
        <p className="text-muted text-sm mb-3">Score = Σ(count × weight) for each activity</p>
        {(Object.keys(settings.engagementWeights) as (keyof typeof settings.engagementWeights)[]).map(key => (
          <div className="form-group weight-row" key={key}>
            <label>{key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())}</label>
            <div className="weight-input-row">
              <input className="input" type="number" step={0.5} min={0} max={20}
                style={{width: 80}}
                value={settings.engagementWeights[key]}
                onChange={e => setWeight(key, +e.target.value)} />
              <div className="weight-bar">
                <div className="weight-fill" style={{width:`${Math.min(100,(settings.engagementWeights[key]/5)*100)}%`}} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="settings-section">
        <h2 className="section-title mb-3">Audio</h2>
        <button
          id="btn-toggle-audio"
          className={`btn ${audioEnabled ? 'btn-success' : 'btn-ghost'}`}
          onClick={() => setAudioEnabled(!audioEnabled)}
        >
          {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {audioEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Disabled'}
        </button>
      </div>

      <div className="settings-section">
        <h2 className="section-title mb-3">Quorum</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Present Delegates (Quorum Count)</label>
            <input className="input" type="number" min={0}
              value={session.quorumCount}
              onChange={e => updateSession({ quorumCount: +e.target.value })} />
          </div>
          <div className="form-group">
            <label>Total Delegates</label>
            <input className="input" type="number" min={1}
              value={session.totalDelegates}
              onChange={e => updateSession({ totalDelegates: +e.target.value })} />
          </div>
        </div>
      </div>

      <button id="btn-save-settings" className="btn btn-primary btn-lg" onClick={save} disabled={saving}>
        <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};
