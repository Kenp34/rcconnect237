import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/feed');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Cercles décoratifs */}
      <div style={{
        position: 'absolute', top: '-100px', left: '-100px',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, #4F8EF7, transparent)',
        opacity: 0.15, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', right: '-80px',
        width: '280px', height: '280px', borderRadius: '50%',
        background: 'radial-gradient(circle, #A78BFA, transparent)',
        opacity: 0.12, pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', margin: '0 auto 16px',
            borderRadius: '16px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontWeight: '900', color: 'white', fontSize: '18px',
            background: 'linear-gradient(135deg, #4F8EF7, #A78BFA)',
            boxShadow: '0 8px 32px rgba(79,142,247,0.3)',
          }}>EC</div>
          <h1 style={{ color: '#E2E8F0', fontWeight: '900', fontSize: '24px', letterSpacing: '-0.5px' }}>
            EnterpriseConnect
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Connectez-vous à votre espace de travail
          </p>
        </div>

        {/* Carte */}
        <div style={{
          background: '#181C27',
          border: '1px solid #2A2F45',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#F87171', borderRadius: '12px',
              padding: '12px', fontSize: '13px',
              textAlign: 'center', marginBottom: '20px',
            }}>{error}</div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: '#64748B', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: '6px',
            }}>Email professionnel</label>
            <input
              type="email"
              placeholder="jean@entreprise.com"
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={{
                width: '100%', background: '#1E2336',
                border: '1px solid #2A2F45', borderRadius: '12px',
                padding: '12px 14px', fontSize: '14px',
                color: '#E2E8F0', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#4F8EF7'}
              onBlur={e => e.target.style.borderColor = '#2A2F45'}
            />
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: '#64748B', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: '6px',
            }}>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={{
                width: '100%', background: '#1E2336',
                border: '1px solid #2A2F45', borderRadius: '12px',
                padding: '12px 14px', fontSize: '14px',
                color: '#E2E8F0', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#4F8EF7'}
              onBlur={e => e.target.style.borderColor = '#2A2F45'}
            />
          </div>

          {/* Bouton */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(135deg, #4F8EF7, #A78BFA)',
              border: 'none', borderRadius: '12px',
              color: 'white', fontWeight: '700', fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              boxShadow: '0 4px 20px rgba(79,142,247,0.4)',
              transition: 'opacity 0.2s',
            }}>
            {loading ? '⏳ Connexion...' : 'Se connecter →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '20px' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: '#4F8EF7', fontWeight: '700', textDecoration: 'none' }}>
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}