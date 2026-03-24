import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { Search, ServerCog, Cpu, MemoryStick, ChevronLeft, ChevronRight } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Processes() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [processes, setProcesses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`ws://localhost:3000/ws?type=dashboard&token=${token}`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'metrics-live') setProcesses(msg.data.processes || []);
      } catch (e) {}
    };
    return () => ws.close();
  }, [token]);

  // Derived Metrics
  const highestCpu = useMemo(() => processes.length > 0 ? [...processes].sort((a,b)=>b.cpu - a.cpu)[0] : null, [processes]);
  const highestRam = useMemo(() => processes.length > 0 ? [...processes].sort((a,b)=>b.mem - a.mem)[0] : null, [processes]);

  // Chart Data Preparation (Top 5 vs Others)
  const cpuChartData = useMemo(() => {
     if (processes.length === 0) return null;
     const top = [...processes].sort((a,b)=>b.cpu - a.cpu).slice(0, 5);
     const othersCpu = processes.slice(5).reduce((acc, curr) => acc + curr.cpu, 0);
     return {
        labels: [...top.map(p => p.name), 'Others'],
        datasets: [{
           data: [...top.map(p => p.cpu), othersCpu],
           backgroundColor: ['#0ea5e9', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', 'rgba(255,255,255,0.05)'],
           borderWidth: 0
        }]
     };
  }, [processes]);

  // Pagination Logic
  const filtered = processes.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || String(p.pid).includes(search));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentChunk = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when searching
  useEffect(() => setCurrentPage(1), [search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ServerCog size={24} color="var(--accent-color)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#fff' }}>{t('process_menu')}</h2>
         </div>
         <div className="user-profile" style={{ minWidth: '300px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <Search size={16} color="var(--text-muted)" />
            <input placeholder={t('search_processes')} value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', color: '#fff', fontSize: '0.9rem' }} />
         </div>
      </div>

      {/* KPIS AND CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
         {/* HIGHEST CPU */}
         <div className="graph-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
               <Cpu size={14} color="var(--danger)" /> {t('highest_cpu')}
            </div>
            {highestCpu ? (
               <div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 500, color: '#fff', wordBreak: 'break-all' }}>{highestCpu.name}</div>
                 <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{highestCpu.cpu.toFixed(1)}% <span style={{color: 'var(--text-muted)'}}>• {highestCpu.pid}</span></div>
               </div>
            ) : <span style={{ color: 'var(--text-muted)' }}>...</span>}
         </div>
         
         {/* HIGHEST RAM */}
         <div className="graph-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
               <MemoryStick size={14} color="var(--accent-color)" /> {t('highest_ram')}
            </div>
            {highestRam ? (
               <div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 500, color: '#fff', wordBreak: 'break-all' }}>{highestRam.name}</div>
                 <div style={{ color: 'var(--accent-color)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{highestRam.mem.toFixed(1)}% <span style={{color: 'var(--text-muted)'}}>• {highestRam.pid}</span></div>
               </div>
            ) : <span style={{ color: 'var(--text-muted)' }}>...</span>}
         </div>

         {/* CPU DISTRIBUTION CHART */}
         <div className="graph-card" style={{ marginBottom: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px' }}>
            {cpuChartData ? <Doughnut data={cpuChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' }} /> : <span style={{ color: 'var(--text-muted)' }}>...</span>}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.8rem', color: 'var(--text-muted)', pointerEvents: 'none', textAlign: 'center' }}>CPU<br/>Dist.</div>
         </div>
      </div>

      {/* PAGINATED TABLE */}
      <div className="graph-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
         <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
               <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                     <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('process_name')}</th>
                     <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('pid')}</th>
                     <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('user')}</th>
                     <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('process_cpu')}</th>
                     <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{t('process_ram')}</th>
                  </tr>
               </thead>
               <tbody>
                  {currentChunk.length > 0 ? currentChunk.map((proc, idx) => (
                     <tr key={`${proc.pid}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{proc.name}</td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{proc.pid}</td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{proc.user}</td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--danger)' }}>{proc.cpu.toFixed(1)}%</td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--accent-color)' }}>{proc.mem.toFixed(1)}%</td>
                     </tr>
                  )) : (
                     <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('no_processes')}</td></tr>
                  )}
               </tbody>
            </table>
         </div>
         
         {/* PAGINATION CONTROLS */}
         {totalPages > 1 && (
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('page')} {currentPage} {t('of')} {totalPages}</span>
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                     disabled={currentPage === 1} 
                     onClick={() => setCurrentPage(p => p - 1)}
                     style={{ background: 'var(--pill-bg)', border: '1px solid var(--border-color)', color: currentPage === 1 ? 'var(--text-muted)' : '#fff', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                     <ChevronLeft size={16} />
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

    </div>
  );
}
