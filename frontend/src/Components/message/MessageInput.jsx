import { useState, useRef } from 'react';
import styles from './MessageInput.module.css';

export default function MessageInput({ onSendMessage, onTyping }) {
  const [content, setContent] = useState('');
  const typingTimeout = useRef(null);

  const handleChange = (e) => {
    setContent(e.target.value);
    onTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSendMessage(content.trim());
    setContent('');
    onTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inputContainer}>
      <textarea
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Votre message... (Entrée pour envoyer, Maj+Entrée pour sauter une ligne)"
        className={styles.textarea}
        rows={1}/>

      <button  type="submit" disabled={!content.trim()} className={styles.sendButton}>
        →
      </button>
    </form>
  );
}