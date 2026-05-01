import React from 'react';
import { useDelegateStore } from '../../store/delegateStore';
import { useSessionStore } from '../../store/sessionStore';
import { updateDelegatePresence } from '../../lib/firestore/delegates';
import { UserCheck, UserMinus, UserPlus, Users } from 'lucide-react';
import './AttendancePanel.css';

export const AttendancePanel: React.FC = () => {
  const { delegates } = useDelegateStore();
  const { session } = useSessionStore();

  const presentCount = delegates.filter(d => d.presenceStatus !== 'absent').length;
  const totalCount = delegates.length;
  const quorum = Math.ceil(totalCount * (2/3));

  const setStatus = async (id: string, status: 'present' | 'present_and_voting' | 'absent') => {
    await updateDelegatePresence(id, status);
  };

  return (
    <div className="attendance-panel card">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-accent" />
          <h3 className="section-title">Attendance & Quorum</h3>
        </div>
        <div className="quorum-badge">
          <span className={`status-dot ${presentCount >= quorum ? 'bg-green' : 'bg-red'}`}></span>
          {presentCount} / {totalCount} (Req: {quorum})
        </div>
      </div>

      <div className="attendance-list scrollbar-hide">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {delegates.map(d => (
              <tr key={d.id} className={d.presenceStatus}>
                <td className="font-medium">{d.country}</td>
                <td>
                  <span className={`presence-label ${d.presenceStatus}`}>
                    {d.presenceStatus.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="actions">
                  <button 
                    className="btn btn-ghost btn-icon btn-xs" 
                    title="Present & Voting"
                    onClick={() => setStatus(d.id, 'present_and_voting')}
                  >
                    <UserCheck size={14} className="text-green" />
                  </button>
                  <button 
                    className="btn btn-ghost btn-icon btn-xs" 
                    title="Present"
                    onClick={() => setStatus(d.id, 'present')}
                  >
                    <UserPlus size={14} className="text-accent" />
                  </button>
                  <button 
                    className="btn btn-ghost btn-icon btn-xs" 
                    title="Absent"
                    onClick={() => setStatus(d.id, 'absent')}
                  >
                    <UserMinus size={14} className="text-red" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
