import { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import styles from './feed.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await axios.get(`${API}/posts/feed`);
        setPosts(data);
      } catch (err) {
        console.error('Erreur chargement feed:', err);
      }
    };
    fetchPosts();
  }, []);

  const handleCreated = async () => {
    try {
      const { data } = await axios.get(`${API}/posts/feed`);
      setPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

 return (
    <div className={styles.feed}>
     
      <CreatePost onCreated={handleCreated} />
      {posts.length === 0 && (
        <p className={styles.emptyState}>Aucune publication pour le moment.</p>
      )}
      {posts.map(post => (
        <PostCard
          key={post._id}
          post={post}
          onDeleted={(id) => setPosts(prev => prev.filter(p => p._id !== id))}
        />
      ))}
    </div>
  );
}
