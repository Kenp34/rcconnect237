import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const COLORS = [
  'linear-gradient(135deg,#4F8EF7,#A78BFA)',
  'linear-gradient(135deg,#34D399,#059669)',
  'linear-gradient(135deg,#F87171,#EC4899)',
  'linear-gradient(135deg,#FBBF24,#F59E0B)',
];

const DEPARTMENTS = ['Informatique', 'Marketing', 'RH', 'Finance', 'Direction', 'Design'];

export default function Directory() {
  const { user: me, token } = useAuth();
  const navigate = useNavigate();
 
  const [users, setUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [followMessage, setFollowMessage] = useState({ show: false, text: '', type: '' });
  const [followingIds, setFollowingIds] = useState([]);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const showMessage = (text, type = 'success') => {
    setFollowMessage({ show: true, text, type });
    setTimeout(() => setFollowMessage({ show: false, text: '', type: '' }), 3000);
  };

  // Récupérer tous les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/users`, axiosConfig);
        setUsers(data);
       
        // Récupérer les IDs suivis par l'utilisateur courant
        const { data: meData } = await axios.get(`${API}/users/me`, axiosConfig);
        const followedIds = meData.following?.map(f => f._id || f) || [];
        setFollowingIds(followedIds);
       
        // Filtrer les suggestions (utilisateurs non suivis et pas moi-même)
        const suggestionsList = data.filter(user =>
          user._id !== me?._id && !followedIds.includes(user._id)
        ).slice(0, 5);
        setSuggestions(suggestionsList);
       
      } catch (error) {
        console.error("Erreur chargement users:", error);
      } finally {
        setLoading(false);
      }
    };
   
    fetchUsers();
  }, [token, me?._id]);

  // Follow / Unfollow
  const handleFollow = async (userId, userName) => {
    try {
      const { data } = await axios.post(`${API}/users/${userId}/follow`, {}, axiosConfig);
     
      if (data.following) {
        setFollowingIds(prev => [...prev, userId]);
        setSuggestions(prev => prev.filter(u => u._id !== userId));
        showMessage(`✅ Vous suivez maintenant ${userName}`, 'success');
      } else {
        setFollowingIds(prev => prev.filter(id => id !== userId));
        showMessage(`❌ Vous ne suivez plus ${userName}`, 'success');
      }
     
      // Mettre à jour la liste des utilisateurs
      setUsers(prev => prev.map(user =>
        user._id === userId
          ? { ...user, isFollowing: data.following }
          : user
      ));
     
    } catch (err) {
      console.error('Erreur follow:', err);
      showMessage(err.response?.data?.message || 'Erreur lors du follow', 'error');
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    if (user._id === me?._id) return false; // Ne pas afficher l'utilisateur courant
   
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || user.department === selectedDepartment;
   
    return matchesSearch && matchesDepartment;
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      <div style={{
        width: '48px', height: '48px',
        border: '4px solid #2A2F45',
        borderTopColor: '#4F8EF7',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
     
      {/* Message de notification */}
      {followMessage.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '12px 24px',
          borderRadius: '12px',
          background: followMessage.type === 'success' ? '#10B981' : '#EF4444',
          color: 'white',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          animation: 'slideDown 0.3s ease',
        }}>
          {followMessage.text}
        </div>
      )}

      {/* Section Suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          background: '#181C27',
          border: '1px solid #2A2F45',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h3 style={{ color: '#E2E8F0', fontSize: '18px', margin: '0 0 16px 0' }}>
            👥 Suggestions - Personnes à suivre
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {suggestions.map(user => (
              <div key={user._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#1E2336',
                  borderRadius: '12px',
                }}>
                <div
                  onClick={() => navigate(`/profile/${user._id}`)}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: COLORS[(user.name?.charCodeAt(0) || 0) % COLORS.length],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '20px',
                    cursor: 'pointer',
                  }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }} onClick={() => navigate(`/profile/${user._id}`)}>
                  <p style={{ color: '#E2E8F0', fontWeight: '600', fontSize: '15px', margin: 0, cursor: 'pointer' }}>
                    {user.name}
                  </p>
                  {user.department && (
                    <p style={{ color: '#64748B', fontSize: '12px', margin: '5px 0 0 0' }}>
                      🏢 {user.department}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleFollow(user._id, user.name)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                  Suivre
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annuaire des membres */}
      <div style={{
        background: '#181C27',
        border: '1px solid #2A2F45',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* En-tête */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #2A2F45',
          background: 'linear-gradient(135deg, rgba(79,142,247,0.1), rgba(167,139,250,0.1))',
        }}>
          <h2 style={{ color: '#E2E8F0', fontSize: '24px', margin: '0 0 8px 0' }}>
            👥 Annuaire des membres
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            {filteredUsers.length} membre{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtres */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #2A2F45',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="🔍 Rechercher par nom ou département..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px 14px',
              background: '#1E2336',
              border: '1px solid #2A2F45',
              borderRadius: '10px',
              color: '#E2E8F0',
              fontSize: '14px',
            }}
          />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              padding: '10px 14px',
              background: '#1E2336',
              border: '1px solid #2A2F45',
              borderRadius: '10px',
              color: '#E2E8F0',
              fontSize: '14px',
              cursor: 'pointer',
            }}>
            <option value="">Tous les départements</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Liste des membres */}
        <div style={{ padding: '20px' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
              Aucun membre trouvé
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {filteredUsers.map((user, index) => (
                <div
                  key={user._id}
                  style={{
                    background: '#1E2336',
                    borderRadius: '12px',
                    padding: '16px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div
                      onClick={() => navigate(`/profile/${user._id}`)}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: COLORS[index % COLORS.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '24px',
                      }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3
                        onClick={() => navigate(`/profile/${user._id}`)}
                        style={{ color: '#E2E8F0', fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                        {user.name}
                      </h3>
                      {user.department && (
                        <p style={{ color: '#4F8EF7', fontSize: '12px', margin: 0 }}>
                          🏢 {user.department}
                        </p>
                      )}
                    </div>
                  </div>
                 
                  {user.bio && (
                    <p style={{ color: '#64748B', fontSize: '12px', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                      {user.bio.length > 80 ? user.bio.substring(0, 80) + '...' : user.bio}
                    </p>
                  )}
                 
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${user._id}`);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        background: 'transparent',
                        border: '1px solid #4F8EF7',
                        borderRadius: '8px',
                        color: '#4F8EF7',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}>
                      Voir profil
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(user._id, user.name);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '8px',
                        background: followingIds.includes(user._id) ? '#1E2336' : 'linear-gradient(135deg,#4F8EF7,#A78BFA)',
                        color: followingIds.includes(user._id) ? '#64748B' : 'white',
                        Border: followingIds.includes(user._id) ? '1px solid #2A2F45' : 'none',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}>
                      {followingIds.includes(user._id) ? '✓ Suivi' : '+ Suivre'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}