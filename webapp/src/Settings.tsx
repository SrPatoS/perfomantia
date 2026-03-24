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

  useEffect(() => {
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
          }
       })
       .catch(console.error);
  }, []);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
     setToast({ message, type });
     setTimeout(() => setToast(null), 3500);
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
           cooldown_mins: parseInt(cooldown)
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

    </div>
  );
}
