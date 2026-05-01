import React from 'react';
import { DelegateList } from '../components/delegates/DelegateList';
import { useSessionStore } from '../store/sessionStore';
import { Users } from 'lucide-react';

export const Delegates: React.FC = () => {
  const { session } = useSessionStore();

  if (!session) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Users size={40} />
        <p style={{ marginTop: 12 }}>Open a session to manage delegates</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <DelegateList />
    </div>
  );
};
