import React, { useEffect } from 'react';
import './index.css';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastStack } from './components/layout/ToastStack';
import { Home } from './pages/Home';
import { SessionPage } from './pages/Session';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Delegates } from './pages/Delegates';
import { ResolutionsPage } from './pages/Resolutions';
import { AddDelegateModal } from './components/delegates/AddDelegateModal';
import { CSVImportModal } from './components/delegates/CSVImportModal';
import './components/delegates/CSVImportModal.css';
import { useUIStore } from './store/uiStore';
import { useTimerStore } from './store/timerStore';
import { useSessionStore } from './store/sessionStore';
import { initAuth } from './lib/firebase';

const PAGE_MAP: Record<string, React.FC> = {
  home: Home,
  session: SessionPage,
  delegates: Delegates,
  resolutions: ResolutionsPage,
  reports: Reports,
  settings: Settings,
};

function App() {
  const { activePage, activeModal, isOnline, setOnline, sidebarCollapsed } = useUIStore();
  const { getSerializedTimers } = useTimerStore();
  const { session } = useSessionStore();

  // Init Firebase anonymous auth — non-blocking
  useEffect(() => {
    initAuth().catch(e => console.warn('Firebase auth failed:', e));
  }, []);

  // Online/offline detection
  useEffect(() => {
    const onOnline  = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Cmd+Z / Ctrl+Z undo handler
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const { popUndo, addNotification } = useUIStore.getState();
        const event = popUndo();
        if (event) {
          const { markEventUndone } = await import('./lib/firestore/timeline');
          await markEventUndone(event.id);
          addNotification(`Undid: ${event.description}`, 'info');
        } else {
          addNotification('Nothing to undo', 'warning');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const PageComponent = PAGE_MAP[activePage] || Home;
  const sidebarW = sidebarCollapsed ? 58 : 220;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!isOnline && (
        <div className="offline-banner">
          ⚠️ You are offline — changes will sync when reconnected
        </div>
      )}

      <Sidebar />

      <div style={{
        flex: 1,
        marginLeft: sidebarW,
        paddingTop: 'var(--header-h)',
        transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)',
        minWidth: 0,
      }}>
        <Header />
        <main>
          <PageComponent />
        </main>
      </div>

      {/* Global modals */}
      {activeModal === 'addDelegate' && <AddDelegateModal />}
      {activeModal === 'csvImport'  && <CSVImportModal />}

      <ToastStack />
    </div>
  );
}

export default App;
