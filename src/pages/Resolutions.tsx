import React from 'react';
import { ResolutionManager } from '../components/resolutions/ResolutionManager';
import { useSessionStore } from '../store/sessionStore';
import { FileText } from 'lucide-react';

export const ResolutionsPage: React.FC = () => {
  const { session } = useSessionStore();

  if (!session) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <FileText size={40} />
        <p style={{ marginTop: 12 }}>Open a session to manage resolutions</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <ResolutionManager />
    </div>
  );
};
