import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from './api';
import { useAuth } from './AuthContext';
import { useServer } from './ServerContext';
import { Line } from 'react-chartjs-2';
import { Cpu, MemoryStick, Activity, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface MetricsData {
  cpu: { current: number };
  memory: { percent: number; used: number; total: number };
  disk: { used: number; total: number; percent: number };
  hardware?: { cpuName: string; cores: number; totalMemGB: string; disks: any[] };
  network: { rx: number; tx: number };
  processes?: any[];
  timestamp?: string;
  uptime?: number;
}
interface ServerState { vpsId: string; status: 'online' | 'offline'; history: MetricsData[]; }

export default function Dashboard() {
  const { token } = useAuth();
  const { currentServer } = useServer();
  const { t } = useTranslation();
  
  const { data: initialServers, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => { const res = await api.get('/servers'); return res.data; }
  });

  const [servers, setServers] = useState<{ [id: string]: ServerState }>({});
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'cpu' | 'memory' | 'disk'>('cpu');


  useEffect(() => {
    // Só inicializa com os dados do histórico da API quando estamos no servidor local
    if (currentServer.id !== 'local') return;
    if (initialServers && Array.isArray(initialServers)) {
       const init: Record<string, ServerState> = {};
       initialServers.forEach((s: any) => { init[s.id] = { vpsId: s.id, status: s.status, history: s.history || [] }; });
       setServers(prev => ({ ...init, ...prev }));
       if (initialServers.length > 0 && !selectedServer) { setSelectedServer(initialServers[0].id); }
    }
  }, [initialServers, currentServer.id]);

  // 🔑 Ref para não capturar selectedServer como stale closure
  const needsAutoSelect = useRef(true);

  useEffect(() => {
    if (!token) return;
    const hostUrl = (currentServer.host_url || window.location.origin).replace(/\/+$/, '');
    const wsProto = hostUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = hostUrl.replace(/^https?/, wsProto) + '/ws?type=dashboard&token=' + (currentServer.api_key || token);
    
    // 🔄 Limpa o histórico ao trocar de servidor
    setServers({});
    setSelectedServer(null);
    needsAutoSelect.current = true; // sinaliza que o próximo vpsId recebido deve ser auto-selecionado

    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'server-status') {
          setServers(p => ({ ...p, [msg.data.vpsId]: { ...(p[msg.data.vpsId] || { vpsId: msg.data.vpsId, history: [] }), status: msg.data.status } }));
        } else if (msg.event === 'metrics-live') {
          const vpsId = msg.vpsId;
          // Usa ref para evitar stale closure — sempre lê o valor atual
          if (needsAutoSelect.current) {
            needsAutoSelect.current = false;
            setSelectedServer(vpsId);
          }
          setServers(p => {
            const srv = p[vpsId] || { vpsId, status: 'online' as const, history: [] };
            const history = [...srv.history, msg.data].slice(-30);
            return { ...p, [vpsId]: { ...srv, history } };
          });
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, [token, currentServer]);

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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <div>
                 <h2 style={{ fontSize: '1.2rem', fontWeight: 500, color: '#fff' }}>{t('host_perf_history')}</h2>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('real_time_telemetry')}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.3)', padding: '0.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                 {['cpu', 'memory', 'disk'].map((type: any) => (
                    <button 
                      key={type}
                      onClick={() => setChartType(type)}
                      style={{ 
                         padding: '0.4rem 0.8rem', 
                         fontSize: '0.8rem', 
                         borderRadius: '6px', 
                         border: 'none', 
                         background: chartType === type ? 'var(--accent-color)' : 'transparent',
                         color: '#fff',
                         fontWeight: 500,
                         cursor: 'pointer',
                         transition: 'background 0.2s'
                      }}
                    >
                      {type === 'cpu' ? 'CPU' : type === 'memory' ? 'RAM' : 'Disco'}
                    </button>
                 ))}
              </div>
            </div>
            {activeData ? <ServerChart history={activeData.history} type={chartType} /> : <div style={{height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>{t('connecting')}</div>}
         </div>
         
         {/* LOWER METRICS (LIKE EXPENSES) */}
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
             <div className="graph-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 500, color: '#fff', marginBottom: '1rem' }}>{t('host_os_details')}</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                   <span>{t('processor')}:</span>
                   <span style={{ color: '#fff', textAlign: 'right' }}>{latest?.hardware?.cpuName || '-'}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                   <span>{t('cores')}:</span>
                   <span style={{ color: '#fff' }}>{latest?.hardware?.cores || 0}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                   <span>{t('total_ram')}:</span>
                   <span style={{ color: '#fff' }}>{latest?.hardware?.totalMemGB || 0} GB</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                   <span>{t('tracking_uptime')}:</span>
                   <span style={{ color: '#fff' }}>{latest ? Math.floor((latest.uptime || 0)/60) : 0} {t('minutes')}</span>
                </div>

                {latest?.hardware?.disks && latest.hardware.disks.length > 0 && (
                   <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>{t('disks')}</span>
                      {latest.hardware.disks.map((d: any, i: number) => (
                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--accent-color)' }}>{d.mount}</span>
                            <span style={{ color: '#fff' }}>{d.use}% <span style={{ color: 'var(--text-muted)' }}>({d.sizeGB} GB)</span></span>
                         </div>
                      ))}
                   </div>
                )}
             </div>
             
             <div className="graph-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 500, color: '#fff', marginBottom: '1rem' }}>{t('top_processes')}</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                   <thead>
                      <tr style={{ color: 'var(--text-muted)' }}>
                         <th style={{ paddingBottom: '0.5rem', fontWeight: 500 }}>{t('process_name')}</th>
                         <th style={{ paddingBottom: '0.5rem', fontWeight: 500 }}>{t('process_cpu')}</th>
                         <th style={{ paddingBottom: '0.5rem', fontWeight: 500 }}>{t('process_ram')}</th>
                      </tr>
                   </thead>
                   <tbody>
                      {latest?.processes?.slice(0, 6).map((proc: any, idx: number) => (
                         <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.5rem 0', color: '#fff' }}>{proc.name}</td>
                            <td style={{ padding: '0.5rem 0', color: 'var(--accent-color)' }}>{proc.cpu.toFixed(1)}%</td>
                            <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>{proc.mem.toFixed(1)}%</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
         </div>
      </div>
    </div>
  );
}

function ServerChart({ history, type = 'cpu' }: { history: MetricsData[], type?: 'cpu' | 'memory' | 'disk' }) {
  if (history.length === 0) return <div style={{ height: 300 }} />;
  
  const labelMap = { cpu: 'CPU Usage (%)', memory: 'RAM Usage (GB)', disk: 'Disk Space (GB)' };
  const colorMap = { cpu: '#0ea5e9', memory: '#10b981', disk: '#eab308' };
  const fillMap = { cpu: 'rgba(14, 165, 233, 0.05)', memory: 'rgba(16, 185, 129, 0.05)', disk: 'rgba(234, 179, 8, 0.05)' };

  const getData = () => {
     if (type === 'memory') return history.map(h => h.memory ? parseFloat((h.memory.used / (1024 ** 3)).toFixed(2)) : 0);
     if (type === 'disk') return history.map(h => h.disk ? parseFloat((h.disk.used / (1024 ** 3)).toFixed(2)) : 0);
     return history.map(h => h.cpu.current);
  };

  const latestData = history[history.length - 1];
  const maxScale = type === 'cpu' ? 100 
     : type === 'memory' ? parseFloat(((latestData?.memory?.total || 0) / (1024 ** 3)).toFixed(1))
     : parseFloat(((latestData?.disk?.total || 0) / (1024 ** 3)).toFixed(1));

  const data = {
    labels: history.map(h => new Date(h.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
    datasets: [{ 
       label: labelMap[type], 
       data: getData(), 
       borderColor: colorMap[type], 
       backgroundColor: fillMap[type], 
       borderWidth: 2, 
       fill: true, 
       tension: 0.2, 
       pointRadius: Array(history.length).fill(0).fill(3, -1), 
       pointBackgroundColor: colorMap[type], 
       pointBorderColor: '#ffffff' 
    }]
  };
  
  const opts = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { legend: { display: false } }, 
    scales: { 
       x: { display: false }, 
       y: { 
          min: 0, 
          max: maxScale || undefined,
          ticks: { 
             color: '#64748b',
             callback: (value: any) => type === 'cpu' ? `${value}%` : `${value.toFixed(1)} GB`
          }, 
          grid: { color: 'rgba(255,255,255,0.02)' } 
       } 
    } 
  };
  return <div style={{ height: 300 }}><Line data={data} options={opts as any} /></div>;
}
