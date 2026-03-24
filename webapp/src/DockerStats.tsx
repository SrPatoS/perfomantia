import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { Search, Container, Play, Square, ChevronRight, RefreshCw, Cpu, HardDrive, Activity } from 'lucide-react';

export default function DockerStats() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [containers, setContainers] = useState<any[]>([]);
  const [volumes, setVolumes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [onlyRunning, setOnlyRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentVolPage, setCurrentVolPage] = useState(1);
  
  const itemsPerPage = 8; 
  const itemsPerVolPage = 6;

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`ws://localhost:3000/ws?type=dashboard&token=${token}`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'metrics-live') {
           setContainers(msg.data.docker || []);
           setVolumes(msg.data.dockerVolumes || []);
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, [token]);

  // Flat sorted output
  const filtered = containers.filter(c => {
     if (onlyRunning && c.state !== 'running') return false;
     if (search && !c.name.includes(search) && !c.image.includes(search)) return false;
     return true;
  });

  const displayItems = useMemo(() => {
     return [...filtered].sort((a,b) => {
        if (a.state === 'running' && b.state !== 'running') return -1;
        if (a.state !== 'running' && b.state === 'running') return 1;
        return (a.name || '').localeCompare(b.name || '');
     });
  }, [filtered]);

  const totalPages = Math.ceil(displayItems.length / itemsPerPage) || 1;
  const currentChunk = displayItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

   const parseSize = (sizeStr: string) => {
      if (!sizeStr || sizeStr === '0B' || sizeStr === '0') return 0;
      const units: Record<string, number> = { b: 1, kb: 1024, mb: 1024**2, gb: 1024**3, tb: 1024**4 };
      const match = sizeStr.toLowerCase().replace(/i/g, '').match(/^([\d.]+)\s*([a-z]+)/);
      if (match) {
         return parseFloat(match[1]) * (units[match[2]] || 1);
      }
      return 0;
   };

   const sortedVolumes = useMemo(() => {
      return [...volumes].sort((a,b) => parseSize(b.size) - parseSize(a.size));
   }, [volumes]);

   const totalVolPages = Math.ceil(sortedVolumes.length / itemsPerVolPage) || 1;
   const currentVolChunk = sortedVolumes.slice((currentVolPage - 1) * itemsPerVolPage, currentVolPage * itemsPerVolPage);

   const runningCount = containers.filter(c => c.state === 'running').length;
   const stoppedCount = containers.length - runningCount;
   const totalCpu = containers.reduce((acc, c) => acc + (c.cpu || 0), 0);
   const totalMemUsageBytes = containers.reduce((acc, c) => acc + (c.memUsage || 0), 0);
   
   const totalVolumeDiskSize = useMemo(() => {
      const sizes = volumes.map(v => parseSize(v.size));
      return sizes.reduce((acc, curr) => acc + curr, 0);
   }, [volumes]);

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

  const formatBytes = (bytes: number) => {
     if (!bytes || bytes === 0) return '0B';
     const k = 1024;
     const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
     const i = Math.floor(Math.log(bytes) / Math.log(k));
     return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
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
               {t('only_running')}
            </label>

            <div className="user-profile" style={{ minWidth: '300px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
               <Search size={16} color="var(--text-muted)" />
               <input placeholder={t('search_processes')} value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', color: '#fff', fontSize: '0.9rem' }} />
            </div>
         </div>
      </div>

      {/* TOP INDICATORS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
         <div className="graph-card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
            <div style={{ padding: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
               <Activity size={24} color="#10b981" />
            </div>
            <div>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('containers')}</div>
               <div style={{ fontSize: '1.2rem', fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981' }}>{runningCount} ▲</span> 
                  <span style={{ color: 'var(--danger)', fontSize: '1rem' }}>{stoppedCount} ▼</span>
               </div>
            </div>
         </div>

         <div className="graph-card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
            <div style={{ padding: '0.8rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '12px' }}>
               <Cpu size={24} color="#0ea5e9" />
            </div>
            <div>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('processing_host')}</div>
               <div style={{ fontSize: '1.2rem', fontWeight: 500, color: '#fff' }}>
                  {totalCpu.toFixed(1)}% <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SUM</span>
               </div>
            </div>
         </div>

         <div className="graph-card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
            <div style={{ padding: '0.8rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
               <Container size={24} color="#f59e0b" />
            </div>
            <div>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('memory_footprint')}</div>
               <div style={{ fontSize: '1.2rem', fontWeight: 500, color: '#fff' }}>
                  {formatBytes(totalMemUsageBytes)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RAM</span>
               </div>
            </div>
         </div>

         <div className="graph-card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
            <div style={{ padding: '0.8rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}>
               <HardDrive size={24} color="#8b5cf6" />
            </div>
            <div>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('total_volumes_size')}</div>
               <div style={{ fontSize: '1.2rem', fontWeight: 500, color: '#fff' }}>
                  {formatBytes(totalVolumeDiskSize)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DISK</span>
               </div>
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
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                     <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500, minWidth: '150px' }}>{t('containers')}</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>CPU %</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>MEM USAGE / LIMIT</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>MEM %</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>NET I/O</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>BLOCK I/O</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>DISK (R/W)</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>PIDS</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('ports')}</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('state')}</th>
                     </tr>
                  </thead>
                  <tbody>
                     {currentChunk.length > 0 ? currentChunk.map((node, idx) => (
                        <tr key={`standalone-${node.id}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                           <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{node.name.length > 20 ? node.name.substring(0, 18) + '...' : node.name}</td>
                           <td style={{ padding: '1rem 1.5rem' }}>
                              {node.state === 'running' ? (
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <span style={{ color: 'var(--danger)' }}>{(node.cpu || 0).toFixed(2)}%</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(node.cpuNormalized || 0).toFixed(2)}% host</span>
                                 </div>
                              ) : <span style={{ color: 'var(--danger)' }}>-</span>}
                           </td>
                           <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>
                              {node.state === 'running' ? node.memUsageStr : '-'}
                           </td>
                           <td style={{ padding: '1rem 1.5rem', color: '#10b981' }}>{node.state === 'running' ? `${(node.mem || 0).toFixed(2)}%` : '-'}</td>
                           <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>
                              {node.state === 'running' ? `${node.netRX} / ${node.netWX}` : '-'}
                           </td>
                           <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>
                              {node.state === 'running' ? `${node.blockR} / ${node.blockW}` : '-'}
                           </td>
                           <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                 <span style={{ color: '#fff' }}>{node.sizeRw || '0B'} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RW</span></span>
                                 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{node.sizeRootFs || '0B'} Root</span>
                              </div>
                           </td>
                           <td style={{ padding: '1rem 1.5rem', color: 'var(--accent-color)' }}>{node.state === 'running' ? node.pids : '-'}</td>
                           <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{formatPorts(node.ports)}</td>
                           <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                 {node.state === 'running' ? <Play fill="#10b981" size={12} color="#10b981" /> : <Square fill="#ef4444" size={12} color="#ef4444" />}
                                 <span style={{ color: node.state === 'running' ? '#10b981' : '#ef4444', fontSize: '0.8rem' }}>{node.state}</span>
                              </div>
                           </td>
                        </tr>
                     )) : (
                        <tr><td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('no_docker')}</td></tr>
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
                        style={{ background: 'var(--pill-bg)', border: '1px solid var(--border-color)', color: currentPage === 1 ? 'var(--text-muted)' : '#fff', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                     >
                        <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                     </button>
                     <button 
                        disabled={currentPage === totalPages} 
                        onClick={() => setCurrentPage(p => p + 1)}
                        style={{ background: 'var(--pill-bg)', border: '1px solid var(--border-color)', color: currentPage === totalPages ? 'var(--text-muted)' : '#fff', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                     >
                        <ChevronRight size={16} />
                     </button>
                  </div>
               </div>
            )}
         </div>
      )}

      {/* VOLUMES SECTION */}
      {volumes.length > 0 && (
         <div className="graph-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 400, color: '#fff' }}>Volumes do Docker</h3>
               <span style={{ fontSize: '0.8rem', background: 'var(--pill-bg)', padding: '0.2rem 0.6rem', borderRadius: '12px', color: 'var(--text-muted)' }}>{volumes.length}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                     <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Nome / Driver</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Tamanho no Disco</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Containers Links</th>
                     </tr>
                  </thead>
                  <tbody>
                     {currentVolChunk.map((vol, idx) => (
                        <tr key={`vol-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                           <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                 <span style={{ fontWeight: 500 }}>{vol.name.length > 50 ? vol.name.substring(0, 48) + '...' : vol.name}</span>
                                 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{vol.driver}</span>
                              </div>
                           </td>
                           <td style={{ padding: '1rem 1.5rem', color: 'var(--accent-color)' }}>{vol.size || '0B'}</td>
                           <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{vol.links}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {totalVolPages > 1 && (
               <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('page')} {currentVolPage} {t('of')} {totalVolPages}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button 
                        disabled={currentVolPage === 1} 
                        onClick={() => setCurrentVolPage(p => p - 1)}
                        style={{ background: 'var(--pill-bg)', border: '1px solid var(--border-color)', color: currentVolPage === 1 ? 'var(--text-muted)' : '#fff', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: currentVolPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                     >
                        <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                     </button>
                     <button 
                        disabled={currentVolPage === totalVolPages} 
                        onClick={() => setCurrentVolPage(p => p + 1)}
                        style={{ background: 'var(--pill-bg)', border: '1px solid var(--border-color)', color: currentVolPage === totalVolPages ? 'var(--text-muted)' : '#fff', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: currentVolPage === totalVolPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
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
