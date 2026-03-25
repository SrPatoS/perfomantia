import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import api from './api';
import Button from './Button';

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [cpuLimit, setCpuLimit] = useState('80');
  const [ramLimit, setRamLimit] = useState('85');
  const [diskLimit, setDiskLimit] = useState('85');
  const [password, setPassword] = useState('');
  
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [cooldown, setCooldown] = useState('15');
  const [databases, setDatabases] = useState<any[]>([]);
  const [dbName, setDbName] = useState('');
  const [dbType, setDbType] = useState('mongo');
  const [dbUri, setDbUri] = useState('');
  const [openSelect, setOpenSelect] = useState(false);
  const [mongoUri, setMongoUri] = useState('');

  const [remoteServers, setRemoteServers] = useState<any[]>([]);
  const [srvName, setSrvName] = useState('');
  const [srvUrl, setSrvUrl] = useState('');
  const [srvKey, setSrvKey] = useState('');

  const loadDatabases = () => {
     api.get('/settings/databases').then(r => setDatabases(r.data || [])).catch(console.error);
  };

  const loadRemoteServers = () => {
     api.get('/settings/servers').then(r => setRemoteServers(r.data || [])).catch(console.error);
  };

  useEffect(() => {
     loadDatabases();
     loadRemoteServers();
     api.get('/settings/alerts')
       .then(r => {
          const d = r.data;
          if (d) {
             setCpuLimit(String(d.cpu_threshold ?? 80));
             setRamLimit(String(d.mem_threshold ?? 85));
             setDiskLimit(String(d.disk_threshold ?? 85));
             setSmtpHost(d.smtp_host || '');
             setSmtpPort(String(d.smtp_port ?? 587));
             setSmtpUser(d.smtp_user || '');
             setSmtpPass(d.smtp_pass || '');
             setEmailTo(d.email_to || '');
             setEnabled(d.enabled === 1);
             setCooldown(String(d.cooldown_mins ?? 15));
             setMongoUri(d.mongo_uri || '');
          }
       })
       .catch(console.error);
  }, []);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
     setToast({ message, type });
     setTimeout(() => setToast(null), 3500);
  };

  const handleAddDb = async () => {
     if (!dbName || !dbUri) return showToast('Preencha os campos!', 'error');
     try {
        await api.post('/settings/databases', { name: dbName, type: dbType, uri: dbUri });
        setDbName(''); setDbUri('');
        showToast('Banco adicionado!');
        loadDatabases();
     } catch(e) { showToast('Erro ao adicionar.', 'error'); }
  };

  const handleDeleteDb = async (id: number) => {
     try {
        await api.delete('/settings/databases/' + id);
        showToast('Banco removido!');
        loadDatabases();
     } catch(e) {}
  };

  const handleAddServer = async () => {
     if (!srvName || !srvUrl) return showToast('Preencha os campos!', 'error');
     try {
        await api.post('/settings/servers', { name: srvName, host_url: srvUrl, api_key: srvKey });
        setSrvName(''); setSrvUrl(''); setSrvKey('');
        showToast('Servidor adicionado!');
        loadRemoteServers();
     } catch(e) { showToast('Erro ao adicionar.', 'error'); }
  };

  const handleDeleteServer = async (id: number) => {
     try {
        await api.delete('/settings/servers/' + id);
        showToast('Servidor removido!');
        loadRemoteServers();
     } catch(e) {}
  };

  const handleSaveServerAlert = async (id: number, patch: any) => {
     try {
        await api.patch('/settings/servers/' + id + '/alerts', patch);
        showToast('Configuração salva!');
        loadRemoteServers();
     } catch(e) { showToast('Erro ao salvar.', 'error'); }
  };

  const handleSaveAlerts = async () => {
     try {
        await api.post('/settings/alerts', {
           cpu_threshold: parseInt(cpuLimit),
           mem_threshold: parseInt(ramLimit),
           disk_threshold: parseInt(diskLimit),
           smtp_host: smtpHost,
           smtp_port: parseInt(smtpPort),
           smtp_user: smtpUser,
           smtp_pass: smtpPass,
           email_to: emailTo,
           enabled: enabled ? 1 : 0,
           cooldown_mins: parseInt(cooldown),
           mongo_uri: mongoUri
        });
        showToast(t('settings_saved') || 'Configurações de alerta salvas!', 'success');
     } catch(e) {
        showToast('Erro ao salvar configurações.', 'error');
     }
  };

  const cardStyle = {
     border: '1px solid var(--border-color)',
     borderRadius: '12px',
     background: 'var(--card-bg)',
     marginBottom: '2rem',
     overflow: 'hidden' as const
  };

  const headerStyle = {
     padding: '1.5rem 1.5rem 0.5rem 1.5rem'
  };

  const bodyStyle = {
     padding: '1rem 1.5rem 1.5rem 1.5rem',
     display: 'flex',
     flexDirection: 'column' as const,
     gap: '1.25rem'
  };

  const footerStyle = {
     padding: '1rem 1.5rem',
     background: 'rgba(0, 0, 0, 0.25)',
     borderTop: '1px solid var(--border-color)',
     display: 'flex',
     justifyContent: 'space-between',
     alignItems: 'center'
  };

  const inputStyle = {
     width: '100%',
     maxWidth: '400px',
     background: 'var(--pill-bg)',
     border: '1px solid rgba(255,255,255,0.1)',
     padding: '0.6rem 1rem',
     borderRadius: '8px',
     color: '#fff',
     fontSize: '0.9rem'
  };

  return (
    <div>
      
      {toast && (
         <div style={{ position: 'fixed', top: '2rem', right: '2rem', background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'slideIn 0.3s ease-out forwards', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</span>
         </div>
      )}

      <div style={cardStyle}>
        <div style={headerStyle}>
           <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#fff', margin: 0 }}>{t('account')}</h3>
        </div>
        
        <div style={bodyStyle}>
           <div>
             <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('username')}</label>
             <input type="text" value={user?.username || ''} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
           </div>
           
           <div>
             <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('change_password')}</label>
             <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
           </div>
        </div>

        <div style={footerStyle}>
           <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Secure your core server access.</span>
           <Button>{t('save_security')}</Button>
        </div>
      </div>


      <div style={cardStyle}>
        <div style={headerStyle}>
           <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#fff', margin: 0 }}>{t('alert_thresholds')}</h3>
        </div>
        
        <div style={bodyStyle}>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
               <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('cpu_alert')}</label>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <input type="number" min="1" max="100" value={cpuLimit} onChange={e => setCpuLimit(e.target.value)} style={{ ...inputStyle, width: '100px' }} /> <span style={{ color: 'var(--text-muted)' }}>%</span>
                 </div>
               </div>
               
               <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('ram_alert')}</label>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <input type="number" min="1" max="100" value={ramLimit} onChange={e => setRamLimit(e.target.value)} style={{ ...inputStyle, width: '100px' }} /> <span style={{ color: 'var(--text-muted)' }}>%</span>
                 </div>
               </div>

               <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Alerta Disco</label>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <input type="number" min="1" max="100" value={diskLimit} onChange={e => setDiskLimit(e.target.value)} style={{ ...inputStyle, width: '100px' }} /> <span style={{ color: 'var(--text-muted)' }}>%</span>
                 </div>
               </div>

               <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Intervalo (Min)</label>
                 <input type="number" min="1" value={cooldown} onChange={e => setCooldown(e.target.value)} style={{ ...inputStyle, width: '80px' }} />
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', whiteSpace: 'nowrap' }}>
                  <div style={{ position: 'relative', width: '36px', height: '20px', background: enabled ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', transition: '0.2s' }} onClick={() => setEnabled(!enabled)}>
                     <div style={{ position: 'absolute', top: '2px', left: enabled ? '18px' : '2px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: '0.2s' }} />
                  </div>
                  <label style={{ fontSize: '0.9rem', color: '#fff', cursor: 'pointer' }} onClick={() => setEnabled(!enabled)}>Habilitar Alertas de Email</label>
               </div>
            </div>

            {enabled && (
               <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 400 }}>Configurações SMTP</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                     <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>SMTP Host</label>
                        <input type="text" placeholder="smtp.gmail.com" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} style={inputStyle} />
                     </div>
                     <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>SMTP Port</label>
                        <input type="number" placeholder="587" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} style={inputStyle} />
                     </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                     <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>SMTP User</label>
                        <input type="text" placeholder="alerts@vps.com" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} style={inputStyle} />
                     </div>
                     <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>SMTP Password</label>
                        <input type="password" placeholder="••••••••" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} style={inputStyle} />
                     </div>
                  </div>
                  <div>
                     <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Destinatário (Email - Separe por vírgula para múltiplos)</label>
                     <input type="email" placeholder="email1@gmail.com, email2@gmail.com" value={emailTo} onChange={e => setEmailTo(e.target.value)} style={{ ...inputStyle, maxWidth: 'none' }} />
                  </div>
               </div>
            )}
         </div>

         <div style={footerStyle}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Metrics crossing these limits trigger warnings.</span>
            <Button onClick={handleSaveAlerts}>{t('save_preference')}</Button>
         </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>
           <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#fff', margin: 0 }}>Bancos de Dados</h3>
        </div>
        <div style={bodyStyle}>
           <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Nome (Ex: Mongo Produção)" value={dbName} onChange={e => setDbName(e.target.value)} style={{ ...inputStyle, width: '200px' }} />
              <div style={{ position: 'relative', width: '150px' }}>
                 <div style={{ ...inputStyle, width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }} onClick={() => setOpenSelect(!openSelect)}>
                    <span>{dbType === 'mongo' ? 'MongoDB' : 'PostgreSQL'}</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>▼</span>
                 </div>
                 {openSelect && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(15,23,36,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', zIndex: 10, marginTop: '0.4rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', overflow: 'hidden' }}>
                       <div 
                         style={{ padding: '0.6rem 1rem', cursor: 'pointer', color: dbType === 'mongo' ? 'var(--accent-color)' : '#e2e8f0', background: 'transparent', transition: 'background 0.2s', fontSize: '0.85rem' }} 
                         onClick={() => { setDbType('mongo'); setOpenSelect(false); }}
                         onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                         onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                       >
                         MongoDB
                       </div>
                       <div 
                         style={{ padding: '0.6rem 1rem', cursor: 'pointer', color: dbType === 'postgres' ? 'var(--accent-color)' : '#e2e8f0', background: 'transparent', transition: 'background 0.2s', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }} 
                         onClick={() => { setDbType('postgres'); setOpenSelect(false); }}
                         onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                         onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                       >
                         PostgreSQL
                       </div>
                    </div>
                 )}
              </div>
              <input type="text" placeholder="Connection String (URI)" value={dbUri} onChange={e => setDbUri(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '250px' }} />
              <Button onClick={handleAddDb}>+ Adicionar</Button>
           </div>

           {databases.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                 <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                       <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nome</th>
                       <th style={{ padding: '0.5rem', textAlign: 'left' }}>Tipo</th>
                       <th style={{ padding: '0.5rem', textAlign: 'left' }}>URL</th>
                       <th style={{ padding: '0.5rem', textAlign: 'right' }}>Ações</th>
                    </tr>
                 </thead>
                 <tbody>
                    {databases.map((d: any) => (
                       <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#fff' }}>{d.name}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: d.type === 'mongo' ? '#10b981' : '#0ea5e9', fontWeight: 500 }}>{d.type.toUpperCase()}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.uri.includes('@') ? '***@' + d.uri.split('@')[1] : d.uri.substring(0,25) + '...'}</td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                             <button onClick={() => handleDeleteDb(d.id)} style={{ padding: '0.3rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Excluir</button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           )}
        </div>
      </div>

    <div style={cardStyle}>
      <div style={headerStyle}>
         <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#fff', margin: 0 }}>🛰️ Servidores Remotos</h3>
         <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>Adicione VPS remotas para monitorar no dropdown do topo.</p>
      </div>
      <div style={bodyStyle}>
         <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Nome (Ex: VPS Nova York)" value={srvName} onChange={e => setSrvName(e.target.value)} style={{ ...inputStyle, width: '180px' }} />
            <input type="text" placeholder="Host URL (Ex: http://ip:3000)" value={srvUrl} onChange={e => setSrvUrl(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '200px' }} />
            <input type="password" placeholder="AGENT_API_KEY" value={srvKey} onChange={e => setSrvKey(e.target.value)} style={{ ...inputStyle, width: '160px' }} />
            <Button onClick={handleAddServer}>+ Adicionar</Button>
         </div>

         {remoteServers.length > 0 && remoteServers.map((s: any) => (
            <div key={s.id} style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1rem', marginTop: '1rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                     <div style={{ color: '#fff', fontWeight: 500 }}>{s.name}</div>
                     <div style={{ color: 'var(--accent-color)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{s.host_url}</div>
                  </div>
                  <button onClick={() => handleDeleteServer(s.id)} style={{ padding: '0.3rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>Excluir</button>
               </div>

               {/* Configuração de Alerta por Servidor */}
               <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                     <div style={{ position: 'relative', width: '32px', height: '18px', background: s.alert_enabled ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', borderRadius: '9px', cursor: 'pointer', transition: '0.2s', flexShrink: 0 }}
                        onClick={() => handleSaveServerAlert(s.id, { alert_enabled: s.alert_enabled ? 0 : 1 })}>
                        <div style={{ position: 'absolute', top: '2px', left: s.alert_enabled ? '16px' : '2px', width: '14px', height: '14px', background: '#fff', borderRadius: '50%', transition: '0.2s' }} />
                     </div>
                     <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Alertas de Email para esta VPS</span>
                  </div>

                  {s.alert_enabled === 1 && (
                     <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                           <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>CPU %</label>
                           <input type="number" min="1" max="100" defaultValue={s.cpu_threshold || 80}
                              id={`cpu-${s.id}`} style={{ ...inputStyle, width: '70px' }} />
                        </div>
                        <div>
                           <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>RAM %</label>
                           <input type="number" min="1" max="100" defaultValue={s.mem_threshold || 85}
                              id={`mem-${s.id}`} style={{ ...inputStyle, width: '70px' }} />
                        </div>
                        <div>
                           <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Disco %</label>
                           <input type="number" min="1" max="100" defaultValue={s.disk_threshold || 85}
                              id={`disk-${s.id}`} style={{ ...inputStyle, width: '70px' }} />
                        </div>
                        <div>
                           <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Cooldown (min)</label>
                           <input type="number" min="1" defaultValue={s.cooldown_mins || 15}
                              id={`cd-${s.id}`} style={{ ...inputStyle, width: '70px' }} />
                        </div>
                        <Button onClick={() => handleSaveServerAlert(s.id, {
                           cpu_threshold: +(document.getElementById(`cpu-${s.id}`) as HTMLInputElement)?.value,
                           mem_threshold: +(document.getElementById(`mem-${s.id}`) as HTMLInputElement)?.value,
                           disk_threshold: +(document.getElementById(`disk-${s.id}`) as HTMLInputElement)?.value,
                           cooldown_mins: +(document.getElementById(`cd-${s.id}`) as HTMLInputElement)?.value,
                        })}>Salvar</Button>
                     </div>
                  )}
               </div>
            </div>
         ))}
      </div>
    </div>
  </div>
  );
}
