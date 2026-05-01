import React, { useState } from 'react';
import { useDelegateStore } from '../../store/delegateStore';
import { useSessionStore } from '../../store/sessionStore';
import { useUIStore } from '../../store/uiStore';
import { UserPlus, Upload, Trash2, UserCheck, UserX, TrendingUp, AlertTriangle } from 'lucide-react';
import './DelegateList.css';

type SortKey = 'country' | 'engagementScore' | 'totalSpeechSeconds' | 'speechCount';

export const DelegateList: React.FC = () => {
  const { delegates, addToQueue, softDelete, togglePresence, speakerQueue } = useDelegateStore();
  const { session } = useSessionStore();
  const { openModal, addNotification } = useUIStore();
  const [sort, setSort] = useState<SortKey>('country');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [filter, setFilter] = useState('');

  const avg = delegates.length > 0
    ? delegates.reduce((s, d) => s + d.totalSpeechSeconds, 0) / delegates.length : 0;
  const threshold = avg * (session?.settings.timeEquityThresholdMultiplier ?? 2);

  const sorted = [...delegates]
    .filter(d => !d.isDeleted && d.country.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const av = a[sort] as string | number;
      const bv = b[sort] as string | number;
      return av < bv ? -sortDir : av > bv ? sortDir : 0;
    });

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir(d => d === 1 ? -1 : 1);
    else { setSort(key); setSortDir(-1); }
  };

  const inQueue = (id: string) => speakerQueue.some(q => q.delegateId === id);

  const fmtTime = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s/60)}m ${s%60}s`;
  };

  const scoreClass = (score: number) =>
    score >= 10 ? 'score-high' : score >= 5 ? 'score-mid' : 'score-low';

  return (
    <div className="delegate-list-card">
      <div className="delegate-list-header">
        <div className="flex items-center gap-2">
          <input
            id="delegate-search"
            className="input"
            placeholder="Search country..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ width: 180 }}
          />
        </div>
        <div className="flex gap-2">
          <button id="btn-csv-import" className="btn btn-ghost btn-sm" onClick={() => openModal('csvImport')}>
            <Upload size={13} /> CSV Import
          </button>
          <button id="btn-add-delegate" className="btn btn-primary btn-sm" onClick={() => openModal('addDelegate')}>
            <UserPlus size={13} /> Add Delegate
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort('country')} className="sortable">
                Country {sort === 'country' ? (sortDir === 1 ? '↑' : '↓') : ''}
              </th>
              <th>Bloc</th>
              <th>Present</th>
              <th onClick={() => toggleSort('speechCount')} className="sortable">
                Speeches {sort === 'speechCount' ? (sortDir === 1 ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => toggleSort('totalSpeechSeconds')} className="sortable">
                Speech Time {sort === 'totalSpeechSeconds' ? (sortDir === 1 ? '↑' : '↓') : ''}
              </th>
              <th>POIs</th>
              <th onClick={() => toggleSort('engagementScore')} className="sortable">
                Score {sort === 'engagementScore' ? (sortDir === 1 ? '↑' : '↓') : ''}
              </th>
              <th>Queue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(d => (
              <tr key={d.id} className={!d.isPresent ? 'row-absent' : ''}>
                <td>
                  <div className="flex items-center gap-2">
                    {d.country}
                    {d.totalSpeechSeconds > threshold && threshold > 0 && (
                      <AlertTriangle size={12} color="var(--amber)" aria-label="Time equity warning" />
                    )}
                  </div>
                </td>
                <td><span className="text-muted text-sm">{d.bloc || '—'}</span></td>
                <td>
                  <button
                    className={`btn btn-icon btn-sm ${d.isPresent ? 'btn-success' : 'btn-ghost'}`}
                    onClick={() => togglePresence(d.id, d.isPresent ? 'absent' : 'present')}
                    title={d.isPresent ? 'Mark absent' : 'Mark present'}
                  >
                    {d.isPresent ? <UserCheck size={13} /> : <UserX size={13} />}
                  </button>
                </td>
                <td className="mono">{d.speechCount}</td>
                <td className="mono">{fmtTime(d.totalSpeechSeconds)}</td>
                <td className="mono">{d.poiAskedCount}/{d.poiAnsweredCount}</td>
                <td>
                  <span className={`font-bold mono ${scoreClass(d.engagementScore)}`}>
                    {d.engagementScore.toFixed(1)}
                  </span>
                </td>
                <td>
                  <button
                    id={`btn-queue-${d.id}`}
                    className={`btn btn-sm ${inQueue(d.id) ? 'btn-secondary' : 'btn-ghost'}`}
                    onClick={() => addToQueue(d)}
                    disabled={inQueue(d.id) || !d.isPresent}
                  >
                    {inQueue(d.id) ? 'Queued' : '+ Queue'}
                  </button>
                </td>
                <td>
                  <button
                    className="btn btn-danger btn-icon btn-sm"
                    onClick={() => { if (confirm(`Remove ${d.country}?`)) softDelete(d.id); }}
                    title="Remove delegate"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            No delegates found
          </div>
        )}
      </div>
    </div>
  );
};
