import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useSessionStore } from '../../store/sessionStore';
import {
  LayoutDashboard, Users, FileText, Settings, Menu, X,
  Home, Wifi, WifiOff, Zap
} from 'lucide-react';
import './Sidebar.css';

const NAV = [
  { id: 'home',     icon: Home,          label: 'Home'      },
  { id: 'session',   icon: LayoutDashboard, label: 'Session'   },
  { id: 'delegates', icon: Users,           label: 'Delegates' },
  { id: 'resolutions', icon: FileText,      label: 'Resolutions' },
  { id: 'reports',   icon: FileText,        label: 'Reports'   },
  { id: 'settings',  icon: Settings,        label: 'Settings'  },
];

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, toggleSidebar, sidebarCollapsed, isOnline } = useUIStore();
  const { session } = useSessionStore();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Zap size={18} />
        </div>
        {!sidebarCollapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">MUN Chair</span>
            <span className="sidebar-brand-sub">Pro</span>
          </div>
        )}
        <button className="btn btn-ghost btn-icon sidebar-toggle" onClick={toggleSidebar}>
          {sidebarCollapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      {session && !sidebarCollapsed && (
        <div className="sidebar-session">
          <div className="sidebar-session-label">Active Session</div>
          <div className="sidebar-session-name">{session.committee}</div>
          <div className="sidebar-session-topic">{session.topic}</div>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            id={`nav-${id}`}
            className={`sidebar-nav-item ${activePage === id ? 'active' : ''}`}
            onClick={() => setActivePage(id)}
          >
            <Icon size={17} />
            {!sidebarCollapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          {!sidebarCollapsed && <span>{isOnline ? 'Connected' : 'Offline'}</span>}
        </div>
      </div>
    </aside>
  );
};
