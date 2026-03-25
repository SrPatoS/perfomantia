import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (token) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication Failed');
      
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <ShieldAlert size={48} color="var(--accent-color)" />
        </div>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>{t('login_access')}</h2>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <input type="text" placeholder={t('username')} value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <input type="password" placeholder={t('password')} value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" style={{ marginTop: '0.5rem' }}>{t('authenticate')}</button>
        </form>
      </div>
    </div>
  );
}
