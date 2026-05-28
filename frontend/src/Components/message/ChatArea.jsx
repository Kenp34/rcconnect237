import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import EmptyChatState from './EmptyChatState';
import styles from './ChatArea.module.css';

const COLORS = [
  'linear-gradient(135deg,#4F8EF7,#A78BFA)',
  'linear-gradient(135deg,#34D399,#059669)',
  'linear-gradient(135deg,#F87171,#EC4899)',
  'linear-gradient(135deg,#FBBF24,#F59E0B)',
];

export default function ChatArea({
  messages,
  activeConversation,
  currentUser,
  loading,
  onSendMessage,
  onTyping,
  typingUser,
  onDeleteMessage,
  onEditMessage
}) {
  const messagesEndRef = useRef(null);

  // ✅ AJOUTEZ CE LOG
  console.log('💬 ChatArea - messages reçus:', messages.length, messages);

  useEffect(() => {
    console.log('📜 Scroll vers le bas');
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeConversation) return <EmptyChatState />;

  const colorIndex = activeConversation.name?.charCodeAt(0) % COLORS.length;

  return (
    <div className={styles.chatArea}>

      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {activeConversation.avatar ? (
              <img src={activeConversation.avatar}
                alt={activeConversation.name}
                className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarPlaceholder}
                style={{ background: COLORS[colorIndex] }}>
                {activeConversation.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.userDetails}>
            <h3 className={styles.userName}>{activeConversation.name}</h3>
            <p className={styles.userDept}>
              {activeConversation.department || 'Employé'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Chargement...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.noMessages}>
            <div className={styles.noMessagesAvatar}
              style={{ background: COLORS[colorIndex] }}>
              {activeConversation.name?.charAt(0).toUpperCase()}
            </div>
            <p className={styles.noMessagesName}>
              {activeConversation.name}
            </p>
            <small className={styles.noMessagesHint}>
              Envoyez un message pour démarrer la discussion
            </small>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // ✅ AJOUTEZ CE LOG
              console.log('🎨 Rendu du message:', message._id, message.content);
              return (
                <MessageBubble
                  key={message._id || index}
                  message={message}
                  isOwn={
                    message.sender?._id === currentUser._id ||
                    message.sender === currentUser._id
                  }
                  currentUser={currentUser}
                  onDelete={onDeleteMessage}
                  onEdit={onEditMessage}
                />
              );
            })}

            {/* Indicateur de frappe */}
            {typingUser && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingBubble}>
                  <span /><span /><span />
                </div>
                <p>{typingUser.name} est en train d'écrire...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput onSendMessage={onSendMessage} onTyping={onTyping} />
    </div>
  );
}