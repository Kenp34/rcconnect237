import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from './Css/PostCard.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes.length);
  const [liked, setLiked] = useState(post.likes.some(id => id.toString() === user?._id?.toString()));
  const [comments, setComments] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
   const [posting, setPosting]           = useState(false);

  const isOwner = post.author?._id?.toString() === user?._id?.toString();

   // ── Like ────────────────────────────────────────────────
  const handleLike = async () => {
    // ✅ Optimistic update AVANT la requête
    setLiked(prev => !prev);
    setLikes(prev => liked ? prev - 1 : prev + 1);

    try {
      const { data } = await axios.post(`${API}/posts/${post._id}/like`);
      // ✅ Synchroniser avec la vraie valeur du serveur
      setLiked(data.liked);
      setLikes(data.likesCount);
    } catch (err) {
      // ✅ Annuler si erreur
      setLiked(prev => !prev);
      setLikes(prev => liked ? prev + 1 : prev - 1);
      console.error('Erreur like:', err.response?.data?.message);
    }
  };

  // ── Commentaire ─────────────────────────────────────────
  const handleComment = async () => {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const { data } = await axios.post(
        `${API}/posts/${post._id}/comment`,
        { text: commentText }
      );
      // ✅ data = le nouveau commentaire avec user populé
      setComments(prev => [...prev, data]);
      setCommentText('');
    } catch (err) {
      console.error('Erreur commentaire:', err);
    } finally {
      setPosting(false);
    }
  };

  // ── Supprimer post ───────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm('Supprimer cette publication ?')) return;
    try {
      await axios.delete(`${API}/posts/${post._id}`);
      onDeleted?.(post._id);
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const timeAgo = new Date(post.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={styles.postCard}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {post.author.name?.[0]?.toUpperCase()}
        </div>
        <div className={styles.authorInfo}>
          <div className={styles.authorName}>{post.author.name}</div>
          <div className={styles.meta}>
            {post.author.department} · {timeAgo}
          </div>
        </div>
        {isOwner && (
          <button onClick={handleDelete} className={styles.deleteBtn}>
            ✕
          </button>
        )}
      </div>

      <p className={styles.content}>{post.content}</p>

      {post.image && (
        <img
          src={`${BASE}${post.image}`}
          alt=""
          className={styles.image}
        />
      )}

      <div className={styles.actions}>
        <button
          onClick={handleLike}
          className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
        >
          👍 {likes > 0 && likes}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className={styles.actionBtn}
        >
          💬 {comments.length > 0 && comments.length}
        </button>
      </div>

      {showComments && (
        <div className={styles.commentsSection}>
          {comments.map((comment, idx) => (
            <div key={idx} className={styles.comment}>
              <div className={styles.commentAvatar}>
                {comment.user?.name?.[0]?.toUpperCase()}
              </div>
              <div className={styles.commentContent}>
                <div className={styles.commentAuthor}>{comment.user?.name}</div>
                <div className={styles.commentText}>{comment.text}</div>
              </div>
            </div>
          ))}
         
          <div className={styles.commentInput}>
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="Écrire un commentaire..."
              className={styles.commentField}
            />
            <button onClick={handleComment} className={styles.commentSubmit}>
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}