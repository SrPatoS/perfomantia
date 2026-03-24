import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [cpuLimit, setCpuLimit] = useState('80');
  const [ramLimit, setRamLimit] = useState('85');
  const [password, setPassword] = useState('');

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

  const btnStyle = {
     borderRadius: '6px',
     fontWeight: 500,
     fontSize: '0.9rem'
  };

  return (
    <div style={{ maxWidth: '750px' }}>
      
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
           <button className="primary" style={btnStyle}>{t('save_security')}</button>
        </div>
      </div>


      <div style={cardStyle}>
        <div style={headerStyle}>
           <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#fff', margin: 0 }}>{t('alert_thresholds')}</h3>
        </div>
        
        <div style={bodyStyle}>
           <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('cpu_alert')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="number" min="1" max="100" value={cpuLimit} onChange={e => setCpuLimit(e.target.value)} style={{ ...inputStyle, width: '100px' }} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('ram_alert')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="number" min="1" max="100" value={ramLimit} onChange={e => setRamLimit(e.target.value)} style={{ ...inputStyle, width: '100px' }} />
                </div>
              </div>
           </div>
        </div>

        <div style={footerStyle}>
           <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Metrics crossing these limits trigger warnings.</span>
           <button className="primary" style={btnStyle}>{t('save_preference')}</button>
        </div>
      </div>

    </div>
  );
}
