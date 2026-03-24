import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { Search, Container, Play, Square, ChevronRight, RefreshCw } from 'lucide-react';

export default function DockerStats() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [containers, setContainers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [onlyRunning, setOnlyRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 8; 

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`ws://localhost:3000/ws?type=dashboard&token=${token}`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'metrics-live') setContainers(msg.data.docker || []);
      } catch (e) {}
    };
    return () => ws.close();
  }, [token]);

  // Derived filtered blocks
  const filtered = containers.filter(c => {
     if (onlyRunning && c.state !== 'running') return false;
     if (search && !c.name.includes(search) && !c.image.includes(search)) return false;
     return true;
  });

  // Flat sorted output
  const displayItems = useMemo(() => {
     return [...filtered].sort((a,b) => (a.name || '').localeCompare(b.name || ''));
  }, [filtered]);

  const totalPages = Math.ceil(displayItems.length / itemsPerPage);
  const currentChunk = displayItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => setCurrentPage(1), [search, onlyRunning]);

  const formatPorts = (portsData: any) => {
     if (!portsData) return '-';
     if (typeof portsData === 'string') {
        try {
           const arr = JSON.parse(portsData);
           if (Array.isArray(arr) && arr[0]?.PublicPort) return `${arr[0].PublicPort}:${arr[0].PrivatePort}`;
        } catch { return portsData; }
     }
     return '-';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      {/* HEADER WITH SEARCH & TOGGLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Container size={24} color="var(--accent-color)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#fff' }}>{t('docker_menu')}</h2>
         </div>

         <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#fff', fontSize: '0.9rem' }}>
               <div onClick={() => setOnlyRunning(p => !p)} style={{ width: '36px', height: '20px', background: onlyRunning ? '#0ea5e9' : 'rgba(255,255,255,0.1)', borderRadius: '20px', position: 'relative', transition: '0.2s' }}>
                   <div style={{ position: 'absolute', top: '2px', left: onlyRunning ? '18px' : '2px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: '0.2s' }} />
               </div>
               Only running
            </label>

            <div className="user-profile" style={{ minWidth: '300px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
               <Search size={16} color="var(--text-muted)" />
               <input placeholder={t('search_processes')} value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', color: '#fff', fontSize: '0.9rem' }} />
            </div>
         </div>
      </div>

      {containers.length === 0 ? (
         <div className="graph-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
            <RefreshCw size={32} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)' }}>{t('no_docker')}</span>
         </div>
      ) : (
         <div className="graph-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
            <div style={{ overflowX: 'auto', flex: 1 }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                     <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('containers')}</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('pid')} / ID</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('image')}</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('ports')}</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('state')}</th>
                     </tr>
                  </thead>
                  <tbody>
                     {currentChunk.length > 0 ? currentChunk.map((node, idx) => (
                        <tr key={`standalone-${node.id}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                           <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{node.name}</td>
                           <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{node.id}</td>
                           <td style={{ padding: '1rem 1.5rem', color: 'var(--accent-color)' }}>{node.image.split(':')[0]}</td>
                           <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{formatPorts(node.ports)}</td>
                           <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                 {node.state === 'running' ? <Play fill="#10b981" size={14} color="#10b981" /> : <Square fill="#ef4444" size={14} color="#ef4444" />}
                                 <span style={{ color: node.state === 'running' ? '#10b981' : '#ef4444', fontSize: '0.85rem' }}>{node.state}</span>
                              </div>
                           </td>
                        </tr>
                     )) : (
                        <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('no_docker')}</td></tr>
                     )}
                  </tbody>
               </table>
            </div>

            {totalPages > 1 && (
               <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('page')} {currentPage} {t('of')} {totalPages}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(p => p - 1)}
                        style={{ background: 'var(--pill-bg)', border: '1px solid var(--border-color)', color: currentPage === 1 ? 'var(--text-muted)' : '#fff', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                     >
                        <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                     </button>
                     <button 
                        disabled={currentPage === totalPages} 
                        onClick={() => setCurrentPage(p => p + 1)}
                        style={{ background: 'var(--pill-bg)', border: '1px solid var(--border-color)', color: currentPage === totalPages ? 'var(--text-muted)' : '#fff', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                     >
                        <ChevronRight size={16} />
                     </button>
                  </div>
               </div>
            )}
         </div>
      )}

    </div>
  );
}
