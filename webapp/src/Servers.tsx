import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Server, Plus, Copy, Check } from 'lucide-react';

export default function Servers() {
  const queryClient = useQueryClient();
  const [vpsId, setVpsId] = useState('');
  const [name, setName] = useState('');
  const [copied, setCopied] = useState('');

  const { data: servers = [], isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const { data } = await api.get('/servers');
      return Array.isArray(data) ? data : [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newServer: { vpsId: string; name: string }) => {
      const { data } = await api.post('/servers', newServer);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setVpsId(''); setName('');
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({ vpsId, name });
  };

  const codeString = (id: string) => `SERVER_URL=ws://yourdomain.com/ws VPS_ID=${id} bun run index.ts`;
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Server size={32} color="var(--accent-color)" />
        <h1 className="page-title" style={{ marginBottom: 0 }}>Server Nodes</h1>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}><Plus size={18}/> Provision New server</h3>
        
        {addMutation.data?.secret && (
           <div style={{ color: '#fff', marginBottom: '1rem', padding: '1rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.3)' }}>
              Server added! Secret Key: <strong style={{color:'var(--accent-color)'}}>{addMutation.data.secret}</strong>
           </div>
        )}
        {addMutation.isError && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Error adding server</div>}
        
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
           <input placeholder="VPS ID (e.g. node-ny-1)" value={vpsId} onChange={e => setVpsId(e.target.value)} required style={{ flex: 1, minWidth: '200px' }} />
           <input placeholder="Display Name (e.g. New York Core)" value={name} onChange={e => setName(e.target.value)} required style={{ flex: 1, minWidth: '200px' }} />
           <button type="submit" disabled={addMutation.isPending}>{addMutation.isPending ? 'Adding...' : 'Add Server'}</button>
        </form>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem', fontWeight: 500 }}>Active Nodes</h3>
        {isLoading ? <p>Loading lists...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 0', fontWeight: 400 }}>VPS ID</th>
                  <th style={{ fontWeight: 400 }}>Name</th>
                  <th style={{ fontWeight: 400 }}>Status</th>
                  <th style={{ fontWeight: 400 }}>Quick Connect Command (Daemon)</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((s: any, i: number) => (
                   <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                     <td style={{ padding: '1.25rem 0', fontWeight: 600, color: 'var(--text-main)' }}>{s.id}</td>
                     <td style={{ color: 'var(--text-muted)' }}>{s.name}</td>
                     <td>
                        <span className={`status-badge ${s.status}`}>
                           <span className="dot" style={{ background: s.status === 'online' ? 'var(--success)' : 'var(--danger)' }} />
                           {s.status.toUpperCase()}
                        </span>
                     </td>
                     <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--pill-bg)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                         <code style={{ flex: 1 }}>{codeString(s.id)}</code>
                         <button type="button" onClick={() => handleCopy(codeString(s.id), s.id)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                           {copied === s.id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                         </button>
                       </div>
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
