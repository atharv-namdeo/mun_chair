import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useDelegateStore } from '../../store/delegateStore';
import { useSessionStore } from '../../store/sessionStore';
import { X } from 'lucide-react';

export const AddDelegateModal: React.FC = () => {
  const { closeModal, addNotification } = useUIStore();
  const { addDelegate: add } = useDelegateStore();
  const { session } = useSessionStore();
  const [form, setForm] = useState({ country: '', delegateName: '', bloc: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!session || !form.country.trim()) return;
    setLoading(true);
    try {
      await add(session.id, form);
      addNotification(`${form.country} added`, 'success');
      closeModal();
    } catch {
      addNotification('Failed to add delegate', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Delegate</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={closeModal}><X size={16} /></button>
        </div>
        <div className="form-group">
          <label>Country *</label>
          <input id="input-country" className="input" placeholder="e.g. Germany" value={form.country} onChange={e => setForm({...form, country: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Delegate Name</label>
          <input id="input-delegate-name" className="input" placeholder="e.g. Maria Schmidt" value={form.delegateName} onChange={e => setForm({...form, delegateName: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Bloc / Alliance</label>
          <input id="input-bloc" className="input" placeholder="e.g. Western Europe" value={form.bloc} onChange={e => setForm({...form, bloc: e.target.value})} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button id="btn-confirm-add-delegate" className="btn btn-primary" onClick={submit} disabled={loading || !form.country.trim()}>
            {loading ? 'Adding...' : 'Add Delegate'}
          </button>
        </div>
      </div>
    </div>
  );
};
