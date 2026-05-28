import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from './Group.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', isPrivate: false
  });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // ✅ fetchGroups directement dans useEffect
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const url = activeTab === 'my'
          ? `${API}/groups?type=my`
          : `${API}/groups`;
        const { data } = await axios.get(url);
        setGroups(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [activeTab]); // ✅ Seule dépendance : activeTab

  // ── Créer ──────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Le nom est obligatoire');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      const { data } = await axios.post(`${API}/groups`, formData);
      setGroups(prev => [data, ...prev]);
      setShowModal(false);
      setFormData({ name: '', description: '', isPrivate: false });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur');
    } finally {
      setCreating(false);
    }
  };

  // ── Rejoindre ──────────────────────────────────────────
  const handleJoin = async (groupId, e) => {
    e.stopPropagation();
    try {
      await axios.post(`${API}/groups/${groupId}/join`);
      setGroups(prev => prev.map(g =>
        g._id === groupId
          ? {
              ...g,
              isMember: true,
              members: [...(g.members || []),
                { user: { _id: user._id, name: user.name }, role: 'member' }
              ]
            }
          : g
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  // ── Quitter ────────────────────────────────────────────
  const handleLeave = async (groupId, e) => {
    e.stopPropagation();
    if (!confirm('Quitter ce groupe ?')) return;
    try {
      await axios.post(`${API}/groups/${groupId}/leave`);
      if (activeTab === 'my') {
        setGroups(prev => prev.filter(g => g._id !== groupId));
      } else {
        setGroups(prev => prev.map(g =>
          g._id === groupId
            ? {
                ...g,
                isMember: false,
                members: (g.members || []).filter(
                  m => m.user?._id !== user._id
                )
              }
            : g
        ));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  // ── Supprimer ──────────────────────────────────────────
  const handleDelete = async (groupId, e) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce groupe définitivement ?')) return;
    try {
      await axios.delete(`${API}/groups/${groupId}`);
      setGroups(prev => prev.filter(g => g._id !== groupId));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Groupes</h1>
          <p className={styles.subtitle}>
            {groups.length} groupe{groups.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          className={styles.createBtn}
          onClick={() => setShowModal(true)}>
          + Créer un groupe
        </button>
      </div>

      {/* ── Onglets ── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => setActiveTab('all')}>
          Tous les groupes
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'my' ? styles.active : ''}`}
          onClick={() => setActiveTab('my')}>
          Mes groupes
        </button>
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      ) : groups.length === 0 ? (
        <div className={styles.empty}>
          <span>👥</span>
          <p>{activeTab === 'my'
            ? 'Vous n\'avez rejoint aucun groupe'
            : 'Aucun groupe disponible'}</p>
          <button
            onClick={() => setShowModal(true)}
            className={styles.createBtn}>
            Créer le premier groupe
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {groups.map((group) => (
            <div
              key={group._id}
              className={styles.card}
              onClick={() => navigate(`/groups/${group._id}`)}>

              {/* Avatar */}
              <div className={styles.cardAvatar}
                style={{
                  background: [
                    'linear-gradient(135deg,#4F8EF7,#A78BFA)',
                    'linear-gradient(135deg,#34D399,#059669)',
                    'linear-gradient(135deg,#F87171,#EC4899)',
                    'linear-gradient(135deg,#FBBF24,#F59E0B)',
                  ][group.name.charCodeAt(0) % 4]
                }}>
                {group.name[0]?.toUpperCase()}
              </div>

              {/* Infos */}
              <div className={styles.cardInfo}>
                <div className={styles.cardTop}>
                  <h3 className={styles.cardName}>
                    {group.name}
                    {group.isPrivate && (
                      <span className={styles.privateBadge}>🔒</span>
                    )}
                    {group.isMember && (
                      <span className={styles.memberBadge}>✓ Membre</span>
                    )}
                  </h3>
                </div>
                {group.description && (
                  <p className={styles.cardDesc}>{group.description}</p>
                )}
                <p className={styles.cardMeta}>
                  👥 {group.members?.length || 0} membre{group.members?.length > 1 ? 's' : ''}
                  {group.createdBy?.name && ` · Par ${group.createdBy.name}`}
                </p>
              </div>

              {/* Actions */}
              <div className={styles.cardActions}
                onClick={e => e.stopPropagation()}>

                {group.isMember ? (
                  <button
                    onClick={e => handleLeave(group._id, e)}
                    className={styles.leaveBtn}>
                    Quitter
                  </button>
                ) : (
                  !group.isPrivate && (
                    <button
                      onClick={e => handleJoin(group._id, e)}
                      className={styles.joinBtn}>
                      + Rejoindre
                    </button>
                  )
                )}

                {group.isAdmin && (
                  <button
                    onClick={e => handleDelete(group._id, e)}
                    className={styles.deleteBtn}
                    title="Supprimer">
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Créer ── */}
      {showModal && (
        <div className={styles.modalOverlay}
          onClick={() => setShowModal(false)}>
          <div className={styles.modal}
            onClick={e => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h2>✨ Créer un groupe</h2>
              <button onClick={() => setShowModal(false)}
                className={styles.closeBtn}>✕</button>
            </div>

            {formError && (
              <div className={styles.error}>{formError}</div>
            )}

            <form onSubmit={handleCreate}>
              <div className={styles.field}>
                <label className={styles.label}>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(f => ({
                    ...f, name: e.target.value
                  }))}
                  placeholder="ex: Équipe Marketing"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(f => ({
                    ...f, description: e.target.value
                  }))}
                  placeholder="Décrivez l'objectif du groupe..."
                  className={styles.input}
                  rows={3}
                />
              </div>

              <div className={styles.checkRow}>
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={formData.isPrivate}
                  onChange={e => setFormData(f => ({
                    ...f, isPrivate: e.target.checked
                  }))}
                />
                <label htmlFor="isPrivate">
                  🔒 Groupe privé
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.cancelBtn}>
                  Annuler
                </button>
                <button type="submit"
                  disabled={creating || !formData.name.trim()}
                  className={styles.submitBtn}>
                  {creating ? 'Création...' : '✨ Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}