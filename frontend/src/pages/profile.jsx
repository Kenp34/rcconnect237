 import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

const COLORS = [
  'linear-gradient(135deg,#4F8EF7,#A78BFA)',
  'linear-gradient(135deg,#34D399,#059669)',
  'linear-gradient(135deg,#F87171,#EC4899)',
  'linear-gradient(135deg,#FBBF24,#F59E0B)',
];

const DEPARTMENTS = ['Informatique', 'Marketing', 'RH', 'Finance', 'Direction', 'Design'];

export default function Profile() {
  const { id } = useParams();
  const { user: me, token } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [followMessage, setFollowMessage] = useState({ show: false, text: '', type: '' });

  const isMe = !id || id === me?._id;

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const showMessage = (text, type = 'success') => {
    setFollowMessage({ show: true, text, type });
    setTimeout(() => setFollowMessage({ show: false, text: '', type: '' }), 3000);
  };

  // Récupérer le profil et les posts
  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      setLoading(true);
      try {
        const endpoint = isMe ? '/users/me' : `/users/${id}`;
        const { data: profData } = await axios.get(`${API}${endpoint}`, axiosConfig);
        setProfile(profData);

        if (!isMe && me) {
          setIsFollowing(
            profData.followers?.some(
              f => (f._id || f).toString() === me._id?.toString()
            )
          );
        }

        const userId = isMe ? me?._id : id;
        if (userId) {
          try {
            const { data: userPosts } = await axios.get(`${API}/posts/user/${userId}`, axiosConfig);
            setPosts(userPosts || []);
          } catch (postErr) {
            console.error("Erreur chargement posts:", postErr);
            setPosts([]);
          }
        }

      } catch (err) {
        console.error('Erreur profil:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (token && (me || isMe)) {
      fetchProfileAndPosts();
    }
  }, [id, me?._id, isMe, token]);

  // Follow / Unfollow
  const handleFollow = async () => {
    if (!id || !me) return;
    try {
      const { data } = await axios.post(`${API}/users/${id}/follow`, {}, axiosConfig);
      setIsFollowing(data.following);

      setProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          followers: data.following
            ? [...(prev.followers || []), { _id: me._id, name: me.name, avatar: me.avatar }]
            : (prev.followers || []).filter(
                f => (f._id || f).toString() !== me._id.toString()
              ),
        };
      });
    
      showMessage(data.following ? `✅ Vous suivez maintenant ${profile?.name}` : `❌ Vous ne suivez plus ${profile?.name}`);
    } catch (err) {
      console.error('Erreur follow:', err);
      showMessage(err.response?.data?.message || 'Erreur lors du follow', 'error');
    }
  };

  // Modifier profil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const { data } = await axios.put(`${API}/users/me`, {
        name: formData.get('name'),
        bio: formData.get('bio'),
        department: formData.get('department'),
      }, axiosConfig);
      setProfile(data);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
      setActiveTab('posts');
      showMessage('✅ Profil mis à jour avec succès !', 'success');
    } catch (err) {
      showMessage('Erreur: ' + err.message, 'error');
    }
  };

  // Upload avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await axios.put(`${API}/users/me/avatar`, fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      });
      setProfile(data);
      showMessage('✅ Avatar mis à jour !', 'success');
    } catch (err) {
      showMessage("Erreur upload avatar: " + err.message, 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const goToCreatePost = () => {
    navigate('/create-post');
  };

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

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#64748B', fontSize: '18px' }}>
      Utilisateur introuvable
    </div>
  );

  const color = COLORS[(profile.name?.charCodeAt(0) || 0) % COLORS.length];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>

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
          background: followMessage.type === 'success' ? '#10B981' : followMessage.type === 'error' ? '#EF4444' : '#3B82F6',
          color: 'white',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          animation: 'slideDown 0.3s ease',
        }}>
          {followMessage.text}
        </div>
      )}

      {/* Carte profil */}
      <div style={{
        background: '#181C27', border: '1px solid #2A2F45',
        borderRadius: '24px', overflow: 'hidden',
        marginBottom: '24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        <div style={{ height: '120px', position: 'relative' }}>
          <div style={{ width: '100%', height: '100%', background: color, opacity: 0.6 }} />
        </div>

        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-48px', marginBottom: '16px' }}>

            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '96px', height: '96px', borderRadius: '50%',
                border: '4px solid #181C27',
                background: profile.avatar ? 'transparent' : color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '36px', fontWeight: '900', color: 'white',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)', overflow: 'hidden',
              }}>
                {profile.avatar
                  ? <img src={`${BASE}${profile.avatar}`} alt="avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : profile.name?.[0]?.toUpperCase()
                }
              </div>
              {isMe && (
                <label style={{
                  position: 'absolute', bottom: '0', right: '0',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#4F8EF7', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '14px',
                  border: '2px solid #181C27',
                }}>
                  {avatarLoading ? '⏳' : '📷'}
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={handleAvatarUpload} />
                </label>
              )}
            </div>

            {/* Bouton Follow / Modifier */}
            {isMe ? (
              <button onClick={() => setActiveTab('edit')}
                style={{
                  padding: '8px 20px', borderRadius: '12px',
                  background: '#1E2336', border: '1px solid #2A2F45',
                  color: '#E2E8F0', fontWeight: '600', fontSize: '14px',
                  cursor: 'pointer',
                }}>
                ✏️ Modifier le profil
              </button>
            ) : (
              <button onClick={handleFollow}
                style={{
                  padding: '8px 20px', borderRadius: '12px', border: 'none',
                  background: isFollowing ? '#1E2336' : 'linear-gradient(135deg,#4F8EF7,#A78BFA)',
                  color: isFollowing ? '#64748B' : 'white',
                  fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                  Border: isFollowing ? '1px solid #2A2F45' : 'none',
                }}>
                {isFollowing ? '✓ Suivi' : '+ Suivre'}
              </button>
            )}
          </div>

          <h2 style={{ color: '#E2E8F0', fontSize: '22px', fontWeight: '900', margin: '0 0 4px' }}>
            {profile.name}
          </h2>
          {profile.department && (
            <div style={{ color: '#4F8EF7', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              🏢 {profile.department}
            </div>
          )}
          {profile.bio && (
            <div style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.5' }}>
              {profile.bio}
            </div>
          )}

          {/* STATS */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #2A2F45' }}>
            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('posts')}>
              <p style={{ color: '#E2E8F0', fontWeight: '900', fontSize: '20px', margin: 0 }}>
                {posts.length}
              </p>
              <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>Publications</p>
            </div>
            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('followers')}>
              <p style={{ color: '#E2E8F0', fontWeight: '900', fontSize: '20px', margin: 0 }}>
                {profile.followers?.length || 0}
              </p>
              <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>Abonnés</p>
            </div>
            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('following')}>
              <p style={{ color: '#E2E8F0', fontWeight: '900', fontSize: '20px', margin: 0 }}>
                {profile.following?.length || 0}
              </p>
              <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>Abonnements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{
        display: 'flex', gap: '6px',
        background: '#181C27', border: '1px solid #2A2F45',
        borderRadius: '16px', padding: '6px',
        marginBottom: '20px',
      }}>
        <button onClick={() => setActiveTab('posts')}
          style={{
            flex: 1, padding: '10px 8px',
            border: 'none', borderRadius: '10px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600',
            background: activeTab === 'posts' ? 'linear-gradient(135deg,#4F8EF7,#A78BFA)' : 'transparent',
            color: activeTab === 'posts' ? 'white' : '#64748B',
          }}>
          📄 Publications ({posts.length})
        </button>
        <button onClick={() => setActiveTab('followers')}
          style={{
            flex: 1, padding: '10px 8px',
            border: 'none', borderRadius: '10px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600',
            background: activeTab === 'followers' ? 'linear-gradient(135deg,#4F8EF7,#A78BFA)' : 'transparent',
            color: activeTab === 'followers' ? 'white' : '#64748B',
          }}>
          👥 Abonnés ({profile.followers?.length || 0})
        </button>
        <button onClick={() => setActiveTab('following')}
          style={{
            flex: 1, padding: '10px 8px',
            border: 'none', borderRadius: '10px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600',
            background: activeTab === 'following' ? 'linear-gradient(135deg,#4F8EF7,#A78BFA)' : 'transparent',
            color: activeTab === 'following' ? 'white' : '#64748B',
          }}>
          📌 Abonnements ({profile.following?.length || 0})
        </button>
        {isMe && (
          <button onClick={() => setActiveTab('edit')}
            style={{
              flex: 1, padding: '10px 8px',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600',
              background: activeTab === 'edit' ? 'linear-gradient(135deg,#4F8EF7,#A78BFA)' : 'transparent',
              color: activeTab === 'edit' ? 'white' : '#64748B',
            }}>
            ✏️ Modifier
          </button>
        )}
      </div>

      {/* Contenu des onglets */}
      <div style={{
        background: '#181C27', border: '1px solid #2A2F45',
        borderRadius: '16px', padding: '20px',
      }}>

        {/* PUBLICATIONS */}
        {activeTab === 'posts' && (
          <div>
            {isMe && (
              <button
                onClick={goToCreatePost}
                style={{
                  width: '100%', padding: '12px', marginBottom: '20px',
                  background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)',
                  border: 'none', borderRadius: '12px',
                  color: 'white', fontWeight: '600', fontSize: '14px',
                  cursor: 'pointer',
                }}>
                ✏️ Créer une publication
              </button>
            )}
          
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: '#64748B' }}>Aucune publication</p>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard key={post._id} post={post} onDeleted={handlePostDeleted} />
                ))
              )}
            </div>
          </div>
        )}

        {/* ABONNÉS */}
        {activeTab === 'followers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.followers?.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748B', padding: '40px' }}>
                Aucun abonné
              </p>
            ) : (
              profile.followers.map((f, i) => (
                <div key={f._id}
                  onClick={() => navigate(`/profile/${f._id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', background: '#1E2336',
                    borderRadius: '12px', cursor: 'pointer',
                  }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: COLORS[i % COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '700', fontSize: '18px',
                  }}>{f.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <p style={{ color: '#E2E8F0', fontWeight: '600', margin: 0 }}>{f.name}</p>
                    {f.department && <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>{f.department}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ABONNEMENTS */}
        {activeTab === 'following' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.following?.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748B', padding: '40px' }}>
                Aucun abonnement
              </p>
            ) : (
              profile.following.map((f, i) => (
                <div key={f._id}
                  onClick={() => navigate(`/profile/${f._id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', background: '#1E2336',
                    borderRadius: '12px', cursor: 'pointer',
                  }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: COLORS[i % COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '700', fontSize: '18px',
                  }}>{f.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <p style={{ color: '#E2E8F0', fontWeight: '600', margin: 0 }}>{f.name}</p>
                    {f.department && <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>{f.department}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MODIFIER PROFIL */}
        {activeTab === 'edit' && isMe && (
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {editSuccess && (
              <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34D399', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                ✅ Profil mis à jour !
              </div>
            )}
            <input name="name" defaultValue={profile.name} placeholder="Nom" required
              style={{ background: '#1E2336', border: '1px solid #2A2F45', borderRadius: '12px', padding: '12px', color: '#E2E8F0' }} />
            <select name="department" defaultValue={profile.department}
              style={{ background: '#1E2336', border: '1px solid #2A2F45', borderRadius: '12px', padding: '12px', color: '#E2E8F0' }}>
              <option value="">Sélectionner un département</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <textarea name="bio" defaultValue={profile.bio} placeholder="Bio" rows="3"
              style={{ background: '#1E2336', border: '1px solid #2A2F45', borderRadius: '12px', padding: '12px', color: '#E2E8F0', resize: 'vertical' }} />
            <button type="submit" style={{ padding: '12px', background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
              💾 Sauvegarder
            </button>
          </form>
        )}
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
