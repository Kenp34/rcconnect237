import { useState, useRef, useEffect } from 'react';
import styles from './MessageMenu.module.css';

export default function MessageMenu({ message, onDelete, onEdit }) {
  const [showMenu, setShowMenu]             = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editContent, setEditContent]       = useState(message.content);
  const menuRef = useRef(null);

  // Fermer menu si clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditSubmit = () => {
    if (!editContent.trim() || editContent.trim() === message.content) return;
    onEdit(message._id, editContent.trim());
    setShowEditModal(false);
  };

  const handleDeleteConfirm = () => {
    onDelete(message._id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* ── Bouton déclencheur ── */}
      <div className={styles.menuWrapper} ref={menuRef}>
        <button
          className={styles.menuTrigger}
          onClick={() => setShowMenu(!showMenu)}>
          ⋮
        </button>

        {/* ── Menu déroulant ── */}
        {showMenu && (
          <div className={styles.menuDropdown}>
            <button
              className={styles.menuItem}
              onClick={() => {
                setEditContent(message.content);
                setShowMenu(false);
                setShowEditModal(true);
              }}>
              ✏️ Modifier
            </button>
            <button
              className={`${styles.menuItem} ${styles.deleteItem}`}
              onClick={() => {
                setShowMenu(false);
                setShowDeleteConfirm(true);
              }}>
              🗑️ Supprimer
            </button>
          </div>
        )}
      </div>

      {/* ── Modal Modifier ── */}
      {showEditModal && (
        <div className={styles.modalOverlay}
          onClick={() => setShowEditModal(false)}>
          <div className={styles.modal}
            onClick={e => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h3>✏️ Modifier le message</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className={styles.closeBtn}>
                ✕
              </button>
            </div>

            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEditSubmit();
                }
                if (e.key === 'Escape') setShowEditModal(false);
              }}
              className={styles.editTextarea}
              rows={3}
              autoFocus
            />

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowEditModal(false)}
                className={styles.cancelBtn}>
                Annuler
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={
                  !editContent.trim() ||
                  editContent.trim() === message.content
                }
                className={styles.submitBtn}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Supprimer ── */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}
          onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal}
            onClick={e => e.stopPropagation()}>

            <div className={styles.confirmIcon}>⚠️</div>
            <h3 className={styles.confirmTitle}>
              Supprimer ce message ?
            </h3>
            <p className={styles.confirmText}>
              Cette action est irréversible.
            </p>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelBtn}>
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={styles.deleteBtn}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}