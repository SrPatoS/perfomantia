import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Line } from 'react-chartjs-2';
import { Database, Activity, Share2, Cpu } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function DatabaseStats() {
   const { token } = useAuth();
   const [databases, setDatabases] = useState<any[]>([]);
   const [selectedDb, setSelectedDb] = useState<number | null>(null);
   const [dbHistory, setDbHistory] = useState<{ [id: number]: any[] }>({});

   useEffect(() => {
     if (!token) return;
     const ws = new WebSocket(`ws://localhost:3000/ws?type=dashboard&token=${token}`);
     
     ws.onmessage = (event) => {
       try {
         const msg = JSON.parse(event.data);
         if (msg.event === 'metrics-live' && msg.data?.databases) {
            setDatabases(msg.data.databases);
            setDbHistory(prev => {
               const u = { ...prev };
               msg.data.databases.forEach((d: any) => {
                  u[d.id] = [...(u[d.id] || []), { ...d.metrics, timestamp: msg.data.timestamp }].slice(-30);
               });
               return u;
            });
         }
       } catch (e) {}
     };
     return () => ws.close();
   }, [token]);

   useEffect(() => {
      if (databases.length > 0 && selectedDb === null) {
         setSelectedDb(databases[0].id);
      }
   }, [databases]);

   const formatBytes = (bytes: number) => {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
   };

   const activeDb = databases.find(d => d.id === selectedDb);
   const history = selectedDb ? dbHistory[selectedDb] || [] : [];
   const latest = activeDb?.metrics;

   if (databases.length === 0) {
      return (
         <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Database size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>Nenhum Banco de Dados Cadastrado.</p>
            <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>Adicione strings de conexão na aba 'Configurações'.</span>
         </div>
      );
   }

   return (
     <div>
         {/* DB Selectors */}
         <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {databases.map(d => (
               <button 
                  key={d.id} 
                  onClick={() => setSelectedDb(d.id)}
                  style={{
                     padding: '0.6rem 1rem',
                     borderRadius: '8px',
                     border: selectedDb === d.id ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.05)',
                     background: selectedDb === d.id ? 'rgba(14, 165, 233, 0.1)' : 'var(--card-bg)',
                     color: selectedDb === d.id ? 'var(--accent-color)' : '#fff',
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.5rem',
                     fontSize: '0.85rem',
                     transition: 'all 0.2s',
                     fontWeight: selectedDb === d.id ? 500 : 400
                  }}
               >
                  <Database size={14} />
                  <span>{d.name}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>({d.type.toUpperCase()})</span>
               </button>
            ))}
         </div>

         {!latest ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tentando conectar ao banco selecionado...</div>
         ) : (
            <div>
               <div className="kpi-row">
                  {/* CONNECTIONS */}
                  <div className="kpi-card accent">
                     <div className="kpi-card-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Database size={14}/> Conexões</span>
                     </div>
                     <div>
                        <div className="kpi-value" style={{ fontSize: '2rem' }}>{latest.connections?.current || 0}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Ativas & {latest.connections?.available || 0} livres</div>
                     </div>
                  </div>

                  {/* QUERIES OR HITS */}
                  <div className="kpi-card">
                     <div className="kpi-card-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Activity size={14}/> Carga / Trab.</span>
                     </div>
                     <div>
                        <div className="kpi-value" style={{ fontSize: '2rem', color: '#fff' }}>{latest.ops?.query || 0}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consultas Totais (Histórico)</div>
                     </div>
                  </div>

                  {/* MEMORY */}
                  <div className="kpi-card">
                     <div className="kpi-card-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Cpu size={14}/> Memória Cache</span>
                     </div>
                     <div>
                        <div className="kpi-value" style={{ fontSize: '2rem', color: '#fff' }}>{(latest.mem?.resident || 0)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>MB</span></div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Virtual: {latest.mem?.virtual || 0} MB</div>
                     </div>
                  </div>

                  {/* NETWORK */}
                  <div className="kpi-card">
                     <div className="kpi-card-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Share2 size={14}/> Tráfego</span>
                     </div>
                     <div>
                        <div className="kpi-value" style={{ fontSize: '2rem', color: '#fff' }}>{formatBytes(latest.network?.bytesIn || 0).split(' ')[0]} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{formatBytes(latest.network?.bytesIn || 0).split(' ')[1]}</span></div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Recebido / Processado</div>
                     </div>
                  </div>
               </div>

               {history.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
                     <div className="graph-card">
                        <div style={{ marginBottom: '1.5rem' }}>
                           <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: '#fff' }}>Histórico de Conexões</h3>
                        </div>
                        <div style={{ height: 250 }}>
                           <Line 
                             data={{
                                labels: history.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
                                datasets: [{
                                   label: 'Conexões Ativas',
                                   data: history.map(h => h.connections?.current || 0),
                                   borderColor: activeDb.type === 'mongo' ? '#10b981' : '#0ea5e9',
                                   backgroundColor: activeDb.type === 'mongo' ? 'rgba(16,185,129,0.05)' : 'rgba(14, 165, 233, 0.05)',
                                   borderWidth: 2, fill: true, tension: 0.1
                                }]
                             }}
                             options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { ticks: { color: '#64748b' } } } } as any}
                           />
                        </div>
                     </div>

                     <div className="graph-card">
                        <div style={{ marginBottom: '1.5rem' }}>
                           <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: '#fff' }}>Atividade do Banco</h3>
                        </div>
                        <div style={{ height: 250 }}>
                           <Line 
                             data={{
                                labels: history.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
                                datasets: [{
                                   label: 'Queries',
                                   data: history.map(h => h.ops?.query || 0),
                                   borderColor: '#eab308',
                                   borderWidth: 2, fill: false, tension: 0.1
                                }]
                             }}
                             options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { ticks: { color: '#64748b' } } } } as any}
                           />
                        </div>
                     </div>
                  </div>
               )}
            </div>
         )}
     </div>
   );
}
