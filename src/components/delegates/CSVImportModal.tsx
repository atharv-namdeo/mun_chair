import React, { useRef, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useDelegateStore } from '../../store/delegateStore';
import { useSessionStore } from '../../store/sessionStore';
import Papa from 'papaparse';
import { X, Upload, CheckCircle } from 'lucide-react';

export const CSVImportModal: React.FC = () => {
  const { closeModal, addNotification } = useUIStore();
  const { bulkImport } = useDelegateStore();
  const { session } = useSessionStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<{country:string;delegateName:string;bloc:string}[]>([]);
  const [loading, setLoading] = useState(false);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        const parsed = (result.data as Record<string,string>[]).map(r => ({
          country: r.country || r.Country || '',
          delegateName: r.delegateName || r.delegate || r.name || '',
          bloc: r.bloc || r.Bloc || '',
        })).filter(r => r.country);
        setRows(parsed);
      }
    });
  };

  const doImport = async () => {
    if (!session || rows.length === 0) return;
    setLoading(true);
    try {
      await bulkImport(session.id, rows);
      addNotification(`${rows.length} delegates imported`, 'success');
      closeModal();
    } catch {
      addNotification('Import failed', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">CSV Bulk Import</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={closeModal}><X size={16} /></button>
        </div>
        <p className="text-muted text-sm mb-3">
          CSV must have columns: <code className="mono">country</code>, optionally <code className="mono">delegateName</code>, <code className="mono">bloc</code>
        </p>
        <div
          className="csv-dropzone"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={24} />
          <p>Click to upload CSV file</p>
          <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={onFile} />
        </div>
        {rows.length > 0 && (
          <div className="csv-preview">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={15} color="var(--green)" />
              <span className="text-sm" style={{color:'var(--green)'}}>
                {rows.length} delegates ready to import
              </span>
            </div>
            <div className="table-wrap" style={{maxHeight:200, overflowY:'auto'}}>
              <table>
                <thead><tr><th>Country</th><th>Name</th><th>Bloc</th></tr></thead>
                <tbody>
                  {rows.slice(0,10).map((r,i) => (
                    <tr key={i}><td>{r.country}</td><td>{r.delegateName||'—'}</td><td>{r.bloc||'—'}</td></tr>
                  ))}
                  {rows.length > 10 && <tr><td colSpan={3} className="text-muted text-sm">…and {rows.length - 10} more</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button id="btn-confirm-csv-import" className="btn btn-primary" onClick={doImport} disabled={loading || rows.length === 0}>
            {loading ? 'Importing...' : `Import ${rows.length} Delegates`}
          </button>
        </div>
      </div>
    </div>
  );
};
