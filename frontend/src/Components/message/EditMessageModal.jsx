import { useState, useEffect, useRef } from 'react';
import styles from './EditMessageModal.module.css';

export default function EditMessageModal({
  isOpen, onClose, onSubmit, initialContent
}) {
  const [content, setContent] = useState(initialContent || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim() && content.trim() !== initialContent) {
      onSubmit(content.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>✏️ Modifier le message</h3>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.textarea}
            placeholder="Votre message..."
            rows={4}
          />
          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose}
              className={styles.cancelBtn}>
              Annuler
            </button>
            <button type="submit"
              disabled={!content.trim() || content === initialContent}
              className={styles.submitBtn}>
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}