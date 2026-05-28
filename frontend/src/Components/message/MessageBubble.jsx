import { formatMessageTime } from '../../helpers/rooms.js';
import MessageMenu from './MessageMenu';
import styles from './MessageBubble.module.css';

const COLORS = [
  'linear-gradient(135deg,#4F8EF7,#A78BFA)',
  'linear-gradient(135deg,#34D399,#059669)',
  'linear-gradient(135deg,#F87171,#EC4899)',
  'linear-gradient(135deg,#FBBF24,#F59E0B)',
];

export default function MessageBubble({ message, isOwn, onDelete, onEdit }) {
  const colorIndex = message.sender?.name?.charCodeAt(0) % COLORS.length;

  // ── Message supprimé ──
  if (message.deleted) {
    return (
      <div className={`${styles.messageBubble}
                       ${isOwn ? styles.own : styles.other}`}>
        {!isOwn && (
          <div className={styles.avatar}
            style={{ background: COLORS[colorIndex] }}>
            {message.sender?.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className={styles.deletedBubble}>
          <span>🗑️</span>
          <em>Message supprimé</em>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.messageBubble}
                     ${isOwn ? styles.own : styles.other}`}>

      {/* Avatar autres utilisateurs */}
      {!isOwn && (
        <div className={styles.avatar}
          style={{ background: COLORS[colorIndex] }}>
          {message.sender?.name?.[0]?.toUpperCase()}
        </div>
      )}

      <div className={styles.messageWrapper}>

        {/* Nom expéditeur */}
        {!isOwn && (
          <div className={styles.senderName}>
            {message.sender?.name}
            {message.sender?.department && (
              <span className={styles.department}>
                · {message.sender.department}
              </span>
            )}
          </div>
        )}

        {/* ── Bulle + MessageMenu ── */}
        <div className={styles.bubbleRow}>

          {/* ✅ MessageMenu gère tout : bouton + modals */}
          {isOwn && (
            <MessageMenu
              message={message}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          )}

          {/* Bulle */}
          <div className={`${styles.bubble}
                           ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
            {message.content}
            {message.edited && (
              <span className={styles.editedBadge}> ✎ modifié</span>
            )}
          </div>
        </div>

        {/* Heure + statut */}
        <div className={`${styles.messageMeta}
                         ${isOwn ? styles.metaOwn : ''}`}>
          <span className={styles.time}>
            {formatMessageTime(message.createdAt)}
          </span>
          {isOwn && (
            <span className={`${styles.status}
                              ${message.read ? styles.statusRead : ''}`}>
              {message.read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}