import { useState, useEffect, useRef} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import styles from './GroupChat.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const COLORS = [
  'linear-gradient(135deg, #4F8EF7, #A78BFA)',
  'linear-gradient(135deg, #34D399, #059669)',
  'linear-gradient(135deg, #F87171, #EC4899)',
  'linear-gradient(135deg, #FBBF24, #F59E0B)',
  'linear-gradient(135deg, #06B6D4, #3B82F6)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
];

export default function GroupChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
// ========== 🆕 ZONE À CHANGER 1 : AJOUTER CES STATES ==========
  const [editModal, setEditModal] = useState({ open: false, messageId: null, content: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, messageId: null });
  const { joinGroupRoom, leaveGroupRoom, sendGroupMessage, sendTypingGroup } = useSocket();

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Écouteurs Socket pour les mises à jour des autres
  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (msg.group === id || msg.group?._id === id) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleMessageEdited = ({ messageId, content, editedAt }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, content, edited: true, editedAt } : m
      ));
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, deleted: true, content: '[Message supprimé]' } : m
      ));
    };

    const handleTyping = ({ userId, userName, isTyping }) => {
      if (userId === user._id) return;
      setTypingUsers(prev => {
        if (isTyping) {
          if (prev.find(t => t.id === userId)) return prev;
          return [...prev, { id: userId, name: userName }];
        }
        return prev.filter(t => t.id !== userId);
      });
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(t => t.id !== userId));
      }, 2000);
    };

    window.addEventListener('newGroupMessage', handleNewMessage);
    window.addEventListener('groupMessageEdited', handleMessageEdited);
    window.addEventListener('groupMessageDeleted', handleMessageDeleted);
    window.addEventListener('userTypingGroup', handleTyping);

    return () => {
      window.removeEventListener('newGroupMessage', handleNewMessage);
      window.removeEventListener('groupMessageEdited', handleMessageEdited);
      window.removeEventListener('groupMessageDeleted', handleMessageDeleted);
      window.removeEventListener('userTypingGroup', handleTyping);
    };
  }, [id, user._id]);

  // Charger groupe et messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: groupData } = await axios.get(`${API}/groups/${id}`);
        setGroup(groupData);
        setIsMember(groupData.isMember);
        setIsAdmin(groupData.isAdmin);
        setMembers(groupData.members || []);

        if (groupData.isMember) {
          const { data: messagesData } = await axios.get(`${API}/groups/${id}/messages`);
          setMessages(messagesData);
          joinGroupRoom(id);
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 404) navigate('/groups');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      leaveGroupRoom(id);
    };
  }, [id, navigate, joinGroupRoom, leaveGroupRoom]);

  // Envoyer message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isMember || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);
    sendTypingGroup(id, false);

    // 🔥 OPTIMISTIC UPDATE - Affiche immédiatement
    const tempMsg = {
      _id: Date.now(),
      content,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      isTemp: true
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data } = await axios.post(`${API}/groups/${id}/messages`, { content });
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? data : m));
      sendGroupMessage(id, content);
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
      alert(err,'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  // Indicateur de frappe
  const handleTyping = (e) => {
    setInput(e.target.value);
    sendTypingGroup(id, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingGroup(id, false);
    }, 1500);
  };
// ========== 🆕 ZONE À CHANGER 2 : REMPLACER handleEdit ==========
  // OUVRE LA MODALE D'ÉDITION
  const handleEdit = (messageId, oldContent) => {
    setEditModal({ open: true, messageId, content: oldContent });
  };

  // SAUVEGARDE LA MODIFICATION
  const handleEditSubmit = async () => {
    const { messageId, content } = editModal;
    if (!content || !content.trim()) return;
    
    const newContent = content.trim();
    const oldMessage = messages.find(m => m._id === messageId);
    
    // OPTIMISTIC UPDATE
    setMessages(prev => prev.map(m =>
      m._id === messageId 
        ? { ...m, content: newContent, edited: true, editedAt: new Date().toISOString(), isUpdating: true }
        : m
    ));
    setEditModal({ open: false, messageId: null, content: '' });

    try {
      await axios.put(`${API}/groups/${id}/messages/${messageId}`, { content: newContent });
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isUpdating: false } : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m._id === messageId 
          ? { ...m, content: oldMessage?.content, edited: false, isUpdating: false }
          : m
      ));
      alert(err,'Erreur lors de la modification');
    }
  };
  
  // ========== 🆕 ZONE À CHANGER 3 : REMPLACER handleDelete ==========
  // OUVRE LA MODALE DE CONFIRMATION
  const handleDeleteClick = (messageId) => {
    setDeleteModal({ open: true, messageId });
  };

  // CONFIRME LA SUPPRESSION
  const handleDeleteConfirm = async () => {
    const { messageId } = deleteModal;
    const oldMessage = messages.find(m => m._id === messageId);
    
    // OPTIMISTIC UPDATE
    setMessages(prev => prev.map(m =>
      m._id === messageId 
        ? { ...m, deleted: true, content: '[Message supprimé]', isDeleting: true }
        : m
    ));
    setDeleteModal({ open: false, messageId: null });

    try {
       await axios.delete(`${API}/groups/${id}/messages/${messageId}`);
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isDeleting: false } : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m._id === messageId 
          ? { ...m, deleted: false, content: oldMessage?.content, isDeleting: false }
          : m
      ));
      alert(err,'Erreur lors de la suppression');
    }
  };
  // ========== FIN ZONE 3 ==========
  // Rejoindre groupe
  const handleJoin = async () => {
    try {
      await axios.post(`${API}/groups/${id}/join`);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  // Exclure membre
  const handleKick = async (memberId, memberName) => {
    if (!confirm(`Exclure ${memberName} du groupe ?`)) return;
    try {
      await axios.delete(`${API}/groups/${id}/members/${memberId}`);
      setMembers(prev => prev.filter(m => (m.user?._id || m.user) !== memberId));
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getGroupColor = (name) => {
    return COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement du groupe...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={styles.notFound}>
        <span>😕</span>
        <p>Groupe introuvable</p>
        <button onClick={() => navigate('/groups')}>Retour aux groupes</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/groups')}>
          ←
        </button>

        <div className={styles.headerInfo}>
          <h2>{group.name}</h2>
          <div className={styles.headerStats}>
            <span>👥 {members.length} membre{members.length > 1 ? 's' : ''}</span>
            {group.isPrivate && <span className={styles.privateBadge}>🔒 Privé</span>}
          </div>
        </div>

        <button
          className={`${styles.membersBtn} ${showMembers ? styles.active : ''}`}
          onClick={() => setShowMembers(!showMembers)}
        >
          👥
        </button>
      </div>

      {/* Main content */}
      <div className={styles.main}>
        {/* Chat area */}
        <div className={styles.chatArea}>
          {!isMember ? (
            <div className={styles.locked}>
              <div className={styles.lockedIcon}>🔒</div>
              <h3>Groupe privé</h3>
              <p>Rejoignez ce groupe pour voir les messages et participer à la discussion</p>
              <button onClick={handleJoin} className={styles.joinBtn}>
                + Rejoindre le groupe
              </button>
            </div>
          ) : (
            <>
              <div className={styles.messages}>
                {messages.length === 0 ? (
                  <div className={styles.emptyMessages}>
                    <span>💬</span>
                    <p>Aucun message pour le moment</p>
                    <small>Soyez le premier à envoyer un message !</small>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender?._id === user._id;
                    const senderName = msg.sender?.name || 'Membre';
                    const senderColor = getGroupColor(senderName);

                    if (msg.deleted) {
                      return (
                        <div key={msg._id} className={styles.deletedMessage}>
                          <em>🗑️ Message supprimé</em>
                          {msg.isDeleting && <span className={styles.syncing}> 🔄</span>}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg._id}
                        className={`${styles.message} ${isOwn ? styles.own : styles.other}`}
                      >
                        {!isOwn && (
                          <div
                            className={styles.avatar}
                            style={{ background: senderColor }}
                          >
                            {senderName[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className={styles.messageContent}>
                          {!isOwn && (
                            <div className={styles.sender}>
                              {senderName}
                              {msg.sender?.department && (
                                <span className={styles.department}> · {msg.sender.department}</span>
                              )}
                            </div>
                          )}
                          <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
                            {msg.content}
                            {msg.edited && (
                              <span className={styles.edited}> (modifié)</span>
                            )}
                            {msg.isUpdating && <span className={styles.syncing}> ✎</span>}
                          </div>
                          <div className={styles.meta}>
                            <span className={styles.time}>{formatTime(msg.createdAt)}</span>
                            
                            {/* ========== 🆕 ZONE À CHANGER 4 : MODIFIER LES BOUTONS ========== */}
                            {isOwn && (
                              <div className={styles.actions}>
                                <button onClick={() => handleEdit(msg._id, msg.content)}>✏️</button>
                                <button onClick={() => handleDeleteClick(msg._id)}>🗑️</button>
                              </div>
                            )}
                            {!isOwn && isAdmin && (
                              <button
                                className={styles.adminDelete}
                                onClick={() => handleDeleteClick(msg._id)}
                              >
                                🗑️
                              </button>
                            )}
                            {/* ========== FIN ZONE 4 ========== */}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {typingUsers.length > 0 && (
                  <div className={styles.typingIndicator}>
                    <div className={styles.typingBubble}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p>
                      {typingUsers.map(t => t.name).join(', ')}
                      {typingUsers.length > 1 ? ' écrivent' : ' écrit'}...
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className={styles.inputForm}>
                <input
                  type="text"
                  value={input}
                  onChange={handleTyping}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Écrivez un message... (Entrée pour envoyer)"
                  className={styles.input}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className={styles.sendBtn}
                >
                  {sending ? '...' : '→'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Members panel */}
        {showMembers && (
          <div className={styles.membersPanel}>
            <div className={styles.membersHeader}>
              <h3>Membres ({members.length})</h3>
              <button onClick={() => setShowMembers(false)} className={styles.closePanel}>
                ✕
              </button>
            </div>
            <div className={styles.membersList}>
              {members.map((m, idx) => {
                const memberId = m.user?._id || m.user;
                const memberName = m.user?.name || 'Membre';
                const memberDept = m.user?.department || '';
                const isMe = memberId === user._id;
                const memberColor = getGroupColor(memberName);

                return (
                  <div key={memberId || idx} className={styles.memberItem}>
                    <div className={styles.memberAvatar} style={{ background: memberColor }}>
                      {memberName[0]?.toUpperCase()}
                    </div>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>
                        {memberName}
                        {isMe && <span className={styles.youTag}> (Vous)</span>}
                      </div>
                      {memberDept && <div className={styles.memberDept}>{memberDept}</div>}
                    </div>
                    <div className={styles.memberBadges}>
                      {m.role === 'admin' && (
                        <span className={styles.adminBadge}>Admin</span>
                      )}
                      {isAdmin && !isMe && m.role !== 'admin' && (
                        <button
                          onClick={() => handleKick(memberId, memberName)}
                          className={styles.kickBtn}
                        >
                          Exclure
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========== 🆕 ZONE À CHANGER 5 : AJOUTER LES MODALES ========== */}

      {/* MODALE D'ÉDITION */}
      {editModal.open && (
        <div className={styles.modalOverlay} onClick={() => setEditModal({ open: false, messageId: null, content: '' })}>
          <div className={styles.editModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>✏️ Modifier le message</h3>
              <button onClick={() => setEditModal({ open: false, messageId: null, content: '' })} className={styles.closeModal}>✕</button>
            </div>
            <textarea
              value={editModal.content}
              onChange={e => setEditModal(prev => ({ ...prev, content: e.target.value }))}
              className={styles.modalTextarea}
              rows={4}
              autoFocus
            />
            <div className={styles.modalFooter}>
              <button onClick={() => setEditModal({ open: false, messageId: null, content: '' })} className={styles.cancelModalBtn}>
                Annuler
              </button>
              <button onClick={handleEditSubmit} className={styles.submitModalBtn}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION SUPPRESSION */}
      {deleteModal.open && (
        <div className={styles.modalOverlay} onClick={() => setDeleteModal({ open: false, messageId: null })}>
          <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>🗑️</div>
            <h3>Supprimer ce message ?</h3>
            <p>Cette action est irréversible.</p>
            <div className={styles.modalFooter}>
              <button onClick={() => setDeleteModal({ open: false, messageId: null })} className={styles.cancelModalBtn}>
                Annuler
              </button>
              <button onClick={handleDeleteConfirm} className={styles.deleteModalBtn}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== FIN ZONE 5 ========== */}
    </div>
  );
    
}

