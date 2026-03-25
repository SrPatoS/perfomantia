import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './AuthContext';
import { Activity, LayoutDashboard, Settings, LogOut, Globe, ServerCog, Container, Database, HardDrive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './i18n';

import Login from './Login';
import Dashboard from './Dashboard';
import SettingsPage from './Settings';
import ProcessesPage from './Processes';
import DockerStatsPage from './DockerStats';
import DatabaseStatsPage from './DatabaseStats';
import StorageStatsPage from './StorageStats';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } }
});

function AppLayout() {
  const { token, user, logout } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'en' ? 'pt' : 'en');

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      {/* SIDEBAR PANEL */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="logo-circle"><Activity size={18} /></div>
          <div>Perfomantia</div>
        </div>
        
        <nav className="nav-links" style={{ flex: 1 }}>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> {t('dashboard')}
          </NavLink>
          <NavLink to="/processes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ServerCog size={18} /> {t('process_menu')}
          </NavLink>
          <NavLink to="/docker" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Container size={18} /> {t('docker_menu')}
          </NavLink>
          <NavLink to="/databases" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Database size={18} /> {t('databases_menu') || 'Bancos de Dados'}
          </NavLink>
          <NavLink to="/storage" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <HardDrive size={18} /> {t('storage_menu') || 'Armazenamento'}
          </NavLink>
        </nav>

        {/* Bottom Profile Area */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 36, height: 36, background: 'var(--accent-gradient)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>{user?.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('administrator')}</div>
              </div>
           </div>
           <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ marginBottom: '0.5rem', display: 'flex' }}>
             <Settings size={18} /> {t('settings')}
           </NavLink>
           <button onClick={logout} className="nav-link" style={{ background: 'transparent', border: 'none', width: '100%', padding: '0.5rem', cursor: 'pointer', textAlign: 'left' }}>
             <LogOut size={16} /> {t('logout')}
           </button>
         </div>
      </aside>
      
      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="top-nav">
          <h1 className="page-title">
             {location.pathname === '/' ? t('my_dashboard') : location.pathname === '/settings' ? t('settings') : location.pathname === '/processes' ? t('process_menu') : location.pathname === '/docker' ? t('docker_menu') : location.pathname === '/databases' ? 'Bancos de Dados' : location.pathname === '/storage' ? 'Armazenamento Total' : ''}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
             <button onClick={toggleLanguage} style={{ background: 'transparent', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', cursor: 'pointer' }}>
                <Globe size={18} color="var(--text-muted)" /> <span style={{fontSize:'0.85rem', fontWeight: 600}}>{t('language')}</span>
             </button>
          </div>
        </header>

        <section className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/processes" element={<ProcessesPage />} />
            <Route path="/docker" element={<DockerStatsPage />} />
            <Route path="/databases" element={<DatabaseStatsPage />} />
            <Route path="/storage" element={<StorageStatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
