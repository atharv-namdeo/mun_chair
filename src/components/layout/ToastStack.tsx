import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={15} />,
  error: <XCircle size={15} />,
  warning: <AlertTriangle size={15} />,
  info: <Info size={15} />,
};

export const ToastStack: React.FC = () => {
  const { notificationQueue, removeNotification } = useUIStore();
  return (
    <div className="toast-stack">
      {notificationQueue.map(n => (
        <div key={n.id} className={`toast toast-${n.type}`}>
          {ICONS[n.type]}
          <span style={{ flex: 1 }}>{n.message}</span>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            style={{ color: 'inherit', opacity: 0.7 }}
            onClick={() => removeNotification(n.id)}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
};
