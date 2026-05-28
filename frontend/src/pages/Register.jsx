import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const departments = [
  'Informatique', 'Marketing', 'RH', 'Finance',
  'Commercial', 'Support Client', 'Direction', 'Design'
];

const inputStyle = {
  width: '100%', background: '#1E2336',
  border: '1px solid #2A2F45', borderRadius: '12px',
  padding: '12px 14px', fontSize: '14px',
  color: '#E2E8F0', outline: 'none',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '700',
  color: '#64748B', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: '6px',
};

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: ''
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/register`, form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur inscription');
    } finally {
      setLoading(false);
    }
  };





  return (
    <div style={{
      minHeight: '100vh', background: '#0F1117',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '16px',
      position: 'relative', overflow: 'hidden',
    }}>

      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, #A78BFA, transparent)',
        opacity: 0.12, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '280px', height: '280px', borderRadius: '50%',
        background: 'radial-gradient(circle, #4F8EF7, transparent)',
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
            Créer un compte
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Rejoignez votre espace de travail
          </p>
        </div>

        {/* Carte */}
        <div style={{
          background: '#181C27', border: '1px solid #2A2F45',
          borderRadius: '20px', padding: '32px',
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

          {[
            { label: 'Nom complet', type: 'text', key: 'name', placeholder: 'Jean Dupont' },
            { label: 'Email', type: 'email', key: 'email', placeholder: 'jean@entreprise.com' },
            { label: 'Mot de passe', type: 'password', key: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#4F8EF7'}
                onBlur={e => e.target.style.borderColor = '#2A2F45'}
              />
            </div>
          ))}

          {/* Département */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Département</label>
            <select
              onChange={e => setForm({ ...form, department: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = '#4F8EF7'}
              onBlur={e => e.target.style.borderColor = '#2A2F45'}
            >
              <option value="" style={{ background: '#1E2336' }}>Sélectionner...</option>
              {departments.map(d => (
                <option key={d} value={d} style={{ background: '#1E2336' }}>{d}</option>
              ))}
            </select>
          </div>

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
            }}>
            {loading ? '⏳ Inscription...' : 'Créer mon compte →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '20px' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: '#4F8EF7', fontWeight: '700', textDecoration: 'none' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}