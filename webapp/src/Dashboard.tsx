import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from './api';
import { useAuth } from './AuthContext';
import { Line } from 'react-chartjs-2';
import { Cpu, MemoryStick, Activity, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface MetricsData {
  cpu: { current: number };
  memory: { percent: number; used: number; total: number };
  disk: { used: number; total: number; percent: number };
  network: { rx: number; tx: number };
  timestamp?: string;
  uptime?: number;
}
interface ServerState { vpsId: string; status: 'online' | 'offline'; history: MetricsData[]; }

export default function Dashboard() {
  const { token } = useAuth();
  const { t } = useTranslation();
  
  const { data: initialServers, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => { const res = await api.get('/servers'); return res.data; }
  });

  const [servers, setServers] = useState<{ [id: string]: ServerState }>({});
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  useEffect(() => {
    if (initialServers && Array.isArray(initialServers)) {
       const init: Record<string, ServerState> = {};
       initialServers.forEach((s: any) => { init[s.id] = { vpsId: s.id, status: s.status, history: s.history || [] }; });
       setServers(prev => ({ ...init, ...prev }));
       if (initialServers.length > 0 && !selectedServer) { setSelectedServer(initialServers[0].id); }
    }
  }, [initialServers]);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`ws://localhost:3000/ws?type=dashboard&token=${token}`);
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
         if (msg.event === 'server-status') {
           setServers(p => ({ ...p, [msg.data.vpsId]: { ...(p[msg.data.vpsId] || { vpsId: msg.data.vpsId, history: [] }), status: msg.data.status } }));
        } else if (msg.event === 'metrics-live') {
           setServers(p => {
             const vpsId = msg.vpsId; const srv = p[vpsId]; if (!srv) return p;
             const history = [...srv.history, msg.data].slice(-30);
             return { ...p, [vpsId]: { ...srv, history } };
           });
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, [token]);

  const activeData = selectedServer ? servers[selectedServer] : null;
  const latest = activeData?.history[activeData.history.length - 1];

  if (isLoading) return <div style={{ color: 'var(--text-muted)' }}>{t('connecting')}</div>;

  return (
    <div className="dashboard-grid">
      {/* LEFT COLUMN */}
      <div>
         <div className="kpi-row">
            {/* CARD 1: CPU */}
            <div className="kpi-card accent">
               <div className="kpi-card-header">
                 <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Cpu size={14}/> {t('cpu_load')}</span>
                 <ArrowUpRight size={14} />
               </div>
               <div>
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>{latest ? latest.cpu.current : 0}<span style={{ fontSize: '1rem' }}>%</span></div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{t('live_processing')}</div>
               </div>
            </div>

            {/* CARD 2: RAM */}
            <div className="kpi-card">
               <div className="kpi-card-header">
                 <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MemoryStick size={14}/> {t('ram_usage')}</span>
                 <ArrowUpRight size={14} color="var(--accent-color)" />
               </div>
               <div>
                  <div className="kpi-value" style={{ fontSize: '2rem', color: '#fff' }}>{latest ? latest.memory.percent : 0}<span style={{ fontSize: '1rem', color: 'var(--accent-color)' }}>%</span></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('volatile_allocation')}</div>
               </div>
            </div>

            {/* CARD 3: Network */}
            <div className="kpi-card">
               <div className="kpi-card-header">
                 <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Activity size={14}/> {t('network_rx')}</span>
               </div>
               <div>
                  <div className="kpi-value" style={{ fontSize: '2rem', color: '#fff' }}>
                     {latest ? (latest.network.rx / 1024).toFixed(0) : 0}
                     <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> KB/s</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>{t('inbound_traffic')}</div>
               </div>
            </div>

            {/* CARD 4: Network TX */}
            <div className="kpi-card">
               <div className="kpi-card-header">
                 <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Activity size={14}/> {t('network_tx')}</span>
               </div>
               <div>
                  <div className="kpi-value" style={{ fontSize: '2rem', color: '#fff' }}>
                     {latest ? (latest.network.tx / 1024).toFixed(0) : 0}
                     <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> KB/s</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{t('outbound_traffic')}</div>
               </div>
            </div>
         </div>

         {/* GRAPH AREA */}
         <div className="graph-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                 <h2 style={{ fontSize: '1.2rem', fontWeight: 500, color: '#fff' }}>{t('host_perf_history')}</h2>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('real_time_telemetry')}</p>
              </div>
              <button style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>{t('filters')}</button>
            </div>
            {activeData ? <ServerChart history={activeData.history} /> : <div style={{height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>{t('connecting')}</div>}
         </div>
         
         {/* LOWER METRICS (LIKE EXPENSES) */}
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
             <div className="graph-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 500, color: '#fff', marginBottom: '1rem' }}>{t('host_os_details')}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                   <span>{t('tracking_uptime')}:</span>
                   <span style={{ color: '#fff' }}>{latest ? Math.floor((latest.uptime || 0)/60) : 0} {t('minutes')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                   <span>{t('node_alias')}:</span>
                   <span style={{ color: '#fff' }}>{activeData?.vpsId}</span>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}

function ServerChart({ history }: { history: MetricsData[] }) {
  if (history.length === 0) return <div style={{ height: 300 }} />;
  const data = {
    labels: history.map(h => new Date(h.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
    datasets: [{ label: 'CPU Usage', data: history.map(h => h.cpu.current), borderColor: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.05)', borderWidth: 2, fill: true, tension: 0.2, pointRadius: Array(history.length).fill(0).fill(3, -1), pointBackgroundColor: '#0ea5e9', pointBorderColor: '#ffffff' }]
  };
  const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { min: 0, max: 100, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.02)' } } } };
  return <div style={{ height: 300 }}><Line data={data} options={opts as any} /></div>;
}
