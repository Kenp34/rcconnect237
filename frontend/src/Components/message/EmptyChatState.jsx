import styles from './EmptyChatState.module.css';

export default function EmptyChatState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.content}>
        <div className={styles.icon}>💬</div>
        <h3 className={styles.title}>Messagerie</h3>
        <p className={styles.subtitle}>
          Sélectionnez une conversation pour commencer à discuter
        </p>
      </div>
    </div>
  );
}