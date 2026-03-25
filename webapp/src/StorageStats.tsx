import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useServer } from './ServerContext';
import { useTranslation } from 'react-i18next';
import { HardDrive, Server, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StorageStats() {
   const { t } = useTranslation();
   const { token } = useAuth();
  const { currentServer } = useServer();
   const [disks, setDisks] = useState<any[]>([]);
   const [volumes, setVolumes] = useState<any[]>([]);

   useEffect(() => {
     // 🔄 Limpa dados ao trocar de servidor
     setDisks([]);
     setVolumes([]);

     const hostUrl = (currentServer.host_url || window.location.origin).replace(/\/+$/, '');
     const wsProto = hostUrl.startsWith('https') ? 'wss' : 'ws';
     const wsUrl = hostUrl.replace(/^https?/, wsProto) + '/ws?type=dashboard&token=' + (currentServer.api_key || token);
     const ws = new WebSocket(wsUrl);
     
     ws.onmessage = (event) => {
       try {
         const msg = JSON.parse(event.data);
         if (msg.event === 'metrics-live') {
            if (msg.data?.hardware?.disks) setDisks(msg.data.hardware.disks);
            if (msg.data?.dockerVolumes) setVolumes(msg.data.dockerVolumes);
         }
       } catch (e) {}
     };
     return () => ws.close();
   }, [token, currentServer]);

   const totalVolumeSize = volumes.reduce((acc, v) => {
      const sizeStr = v.size || '0B';
      const match = sizeStr.match(/([0-9.]+)\s*(GB|MB|KB|B)/i);
      if (!match) return acc;
      const num = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      let bytes = num;
      if (unit === 'GB') bytes *= 1024 * 1024 * 1024;
      if (unit === 'MB') bytes *= 1024 * 1024;
      if (unit === 'KB') bytes *= 1024;
      return acc + bytes;
   }, 0);

   const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
   };

   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;

   const parseSizeToBytes = (sizeStr: string) => {
      const match = (sizeStr || '').match(/([0-9.]+)\s*(GB|MB|KB|B)/i);
      if (!match) return 0;
      const num = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      if (unit === 'GB') return num * 1024 * 1024 * 1024;
      if (unit === 'MB') return num * 1024 * 1024;
      if (unit === 'KB') return num * 1024;
      return num;
   };

   const sortedVolumes = [...volumes].sort((a, b) => parseSizeToBytes(b.size) - parseSizeToBytes(a.size));
   const totalPages = Math.ceil(sortedVolumes.length / itemsPerPage);
   const paginatedVolumes = sortedVolumes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

   return (
     <div>
         <div className="kpi-row">
            {/* TOTAL DISKS SIZE */}
            <div className="kpi-card">
               <div className="kpi-card-header"><span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><HardDrive size={14}/> Total Partições</span></div>
               <div>
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>
                     {disks.reduce((acc, d) => acc + parseFloat(d.sizeGB || '0'), 0).toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>GB</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Soma de todos os mounts</div>
               </div>
            </div>

            {/* DOCKER VOLUMES SIZE */}
            <div className="kpi-card">
               <div className="kpi-card-header"><span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Server size={14}/> Volumes Docker</span></div>
               <div>
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>{formatBytes(totalVolumeSize).split(' ')[0]} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{formatBytes(totalVolumeSize).split(' ')[1]}</span></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{volumes.length} volumes isolados</div>
               </div>
            </div>
         </div>

         {/* DISKS LIST */}
         <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.2rem', fontWeight: 500 }}>Partições de Disco</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
               {disks.map((d, i) => (
                  <div key={i} className="kpi-card" style={{ padding: '1.25rem' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>{d.mount}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{d.sizeGB} GB</span>
                     </div>
                     <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.6rem' }}>
                        <div style={{ height: '100%', width: `${d.use}%`, background: d.use > 85 ? 'var(--danger)' : d.use > 70 ? 'var(--warning)' : 'var(--accent-color)', borderRadius: '4px', transition: 'width 0.5s' }} />
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>{(parseFloat(d.sizeGB) * (d.use / 100)).toFixed(1)} GB Utilizados</span>
                        <span style={{ color: d.use > 85 ? 'var(--danger)' : '#fff', fontWeight: 500 }}>{d.use}%</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* DOCKER VOLUMES LIST */}
         {volumes.length > 0 && (
            <div style={{ marginTop: '2.5rem' }}>
               <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.2rem', fontWeight: 500 }}>Volumes Docker Isolados</h3>
               <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1rem', backdropFilter: 'blur(10px)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                     <thead>
                        <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                           <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nome do Volume</th>
                           <th style={{ padding: '0.75rem', textAlign: 'left' }}>Driver</th>
                           <th style={{ padding: '0.75rem', textAlign: 'right' }}>Espaço Ocupado</th>
                        </tr>
                     </thead>
                     <tbody>
                        {paginatedVolumes.map((v, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem', color: '#fff', fontFamily: 'monospace', fontSize: '0.85rem' }}>{v.name.substring(0, 45)}{v.name.length > 45 ? '...' : ''}</td>
                              <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{v.driver}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--accent-color)', fontWeight: 500 }}>{v.size}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  {/* Pagination Controls */}
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
         )}
     </div>
   );
}
