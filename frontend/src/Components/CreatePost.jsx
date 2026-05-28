import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from './Css/CreatePost.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function CreatePost({ onCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (image) formData.append('image', image);

      await axios.post(`${API}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setContent('');
      setImage(null);
      onCreated();
    } catch (err) {
      console.error('Erreur publication:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.createPost}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <textarea
          className={styles.input}
          rows="3"
          placeholder="Partagez une actualité avec vos collègues..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>

      {image && (
        <div className={styles.imagePreview}>
          📎 {image.name}
          <button onClick={() => setImage(null)} className={styles.removeImage}>
            ✕
          </button>
        </div>
      )}

      <div className={styles.actions}>
        <label className={styles.imageLabel}>
          📷 Ajouter une image
          <input
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={e => setImage(e.target.files[0])}
          />
        </label>
        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className={styles.submitBtn}
        >
          {loading ? 'Publication...' : 'Publier →'}
        </button>
      </div>
    </div>
  );
}