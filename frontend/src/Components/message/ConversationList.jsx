import { useState } from 'react';
import { formatMessageTime } from '../../helpers/rooms.js';
import styles from './ConversationList.module.css';

export default function ConversationList({
  conversations,
  following = [],
  activeConversation,
  onSelectConversation,
  currentUser
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // IDs des personnes avec qui on a déjà une conversation
  const conversationUserIds = conversations.map(conv => {
    const other = conv.sender?._id === currentUser._id
      ? conv.recipient?._id
      : conv.sender?._id;
    return other;
  });

  // Abonnements sans conversation existante
  const followingWithoutConv = following.filter(
    f => !conversationUserIds.includes(f._id)
  );

  // Filtres par recherche
  const filteredConversations = conversations.filter(conv => {
    const other = conv.sender?._id === currentUser._id
      ? conv.recipient : conv.sender;
    return other?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredFollowing = followingWithoutConv.filter(f =>
    f.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.conversationList}>

      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Messages</h2>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.conversations}>

        {/* Conversations récentes */}
        {filteredConversations.length > 0 && (
          <>
            <p className={styles.sectionLabel}>Récents</p>
            {filteredConversations.map((conv) => {
              const other = conv.sender?._id === currentUser._id
                ? conv.recipient : conv.sender;
              if (!other) return null;
              const isActive = activeConversation?._id === other._id;

              return (
                <div key={conv._id}
                  className={`${styles.conversationItem}
                              ${isActive ? styles.active : ''}`}
                  onClick={() => onSelectConversation(other)}>

                  <div className={styles.avatarWrapper}>
                    {other.avatar ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL
                          ?.replace('/api', '')}${other.avatar}`}
                        alt={other.name}
                        className={styles.avatarImg} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {other.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {conv.unread && (
                      <span className={styles.unreadDot} />
                    )}
                  </div>

                  <div className={styles.convInfo}>
                    <div className={styles.convTop}>
                      <span className={styles.convName}>{other.name}</span>
                      <span className={styles.convTime}>
                        {formatMessageTime(conv.createdAt)}
                      </span>
                    </div>
                    <p className={styles.lastMessage}>
                      {conv.sender?._id === currentUser._id && 'Vous: '}
                      {conv.content?.substring(0, 35)}
                      {conv.content?.length > 35 ? '...' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Abonnements sans conversation */}
        {filteredFollowing.length > 0 && (
          <>
            <p className={styles.sectionLabel}>Abonnements</p>
            {filteredFollowing.map((f) => {
              const isActive = activeConversation?._id === f._id;
              return (
                <div key={f._id}
                  className={`${styles.conversationItem}
                              ${isActive ? styles.active : ''}`}
                  onClick={() => onSelectConversation(f)}>

                  <div className={styles.avatarWrapper}>
                    {f.avatar ? (
                      <img src={f.avatar} alt={f.name}
                        className={styles.avatarImg} />
                    ) : (
                      <div className={styles.avatarPlaceholder}
                        style={{
                          background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)'
                        }}>
                        {f.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className={styles.convInfo}>
                    <div className={styles.convTop}>
                      <span className={styles.convName}>{f.name}</span>
                      <span className={styles.newBadge}>Nouveau</span>
                    </div>
                    <p className={styles.lastMessage}>
                      {f.department || 'Employé'} · Démarrer une discussion
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Vide */}
        {filteredConversations.length === 0 &&
         filteredFollowing.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>💬</span>
            <p>Aucune conversation</p>
            <small>Suivez des collègues pour leur écrire</small>
          </div>
        )}
      </div>
    </div>
  );
}