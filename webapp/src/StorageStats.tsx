import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { HardDrive, Server, RefreshCw } from 'lucide-react';

export default function StorageStats() {
   const { token } = useAuth();
   const [disks, setDisks] = useState<any[]>([]);
   const [volumes, setVolumes] = useState<any[]>([]);
   const [databases, setDatabases] = useState<any[]>([]);

   useEffect(() => {
     const ws = new WebSocket(`ws://localhost:3000/ws?type=dashboard&token=${token}`);
     
     ws.onmessage = (event) => {
       try {
         const msg = JSON.parse(event.data);
         if (msg.event === 'metrics-live') {
            if (msg.data?.hardware?.disks) setDisks(msg.data.hardware.disks);
            if (msg.data?.dockerVolumes) setVolumes(msg.data.dockerVolumes);
            if (msg.data?.databases) setDatabases(msg.data.databases);
         }
       } catch (e) {}
     };
     return () => ws.close();
   }, [token]);

   const totalVolumeSize = volumes.reduce((acc, v) => {
      const sizeStr = v.size || '0B';
      const match = sizeStr.match(/([0-9.]+)\\s*(GB|MB|KB|B)/i);
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
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
   };

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
                        {volumes.map((v, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem', color: '#fff', fontFamily: 'monospace', fontSize: '0.85rem' }}>{v.name.substring(0, 35)}{v.name.length > 35 ? '...' : ''}</td>
                              <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{v.driver}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--accent-color)', fontWeight: 500 }}>{v.size}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}
     </div>
   );
}
