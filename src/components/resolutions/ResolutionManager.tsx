import React, { useState } from 'react';
import { useResolutionStore } from '../store/resolutionStore';
import { useSessionStore } from '../store/sessionStore';
import { useDelegateStore } from '../store/delegateStore';
import { createResolution, updateResolutionStatus } from '../lib/firestore/resolutions';
import { FileText, Plus, Check, X, FileCheck, ExternalLink } from 'lucide-react';
import './ResolutionManager.css';

export const ResolutionManager: React.FC = () => {
  const { resolutions } = useResolutionStore();
  const { session } = useSessionStore();
  const { delegates } = useDelegateStore();
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', code: '', contentUrl: ''
  });

  const handleCreate = async () => {
    if (!session || !form.title || !form.code) return;
    await createResolution({
      sessionId: session.id,
      title: form.title,
      code: form.code,
      contentUrl: form.contentUrl,
      status: 'working_paper',
      sponsors: [],
      signatories: []
    });
    setShowForm(false);
    setForm({ title: '', code: '', contentUrl: '' });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'passed': return 'var(--green)';
      case 'failed': return 'var(--red)';
      case 'draft_resolution': return 'var(--accent)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="res-manager">
      <div className="res-header">
        <h2 className="flex items-center gap-2"><FileText size={20} /> Documents & Resolutions</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> New Document
        </button>
      </div>

      {showForm && (
        <div className="res-form card">
          <div className="form-group">
            <label>Title</label>
            <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Peaceful Nuclear Energy" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Code</label>
              <input className="input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g. WP 1.1" />
            </div>
            <div className="form-group">
              <label>URL (Optional)</label>
              <input className="input" value={form.contentUrl} onChange={e => setForm({...form, contentUrl: e.target.value})} placeholder="Link to document" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleCreate}>Create</button>
          </div>
        </div>
      )}

      <div className="res-grid">
        {resolutions.map(res => (
          <div key={res.id} className="res-card card">
            <div className="res-card-header">
              <span className="res-code mono">{res.code}</span>
              <span className="res-status-badge" style={{ background: getStatusColor(res.status) + '22', color: getStatusColor(res.status) }}>
                {res.status.replace('_', ' ')}
              </span>
            </div>
            <h3 className="res-title">{res.title}</h3>
            
            <div className="res-actions">
              <select 
                value={res.status} 
                className="input input-sm"
                onChange={(e) => updateResolutionStatus(res.id, e.target.value as any, session!.id)}
              >
                <option value="working_paper">Working Paper</option>
                <option value="draft_resolution">Draft Resolution</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
              {res.contentUrl && (
                <a href={res.contentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon btn-sm">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
