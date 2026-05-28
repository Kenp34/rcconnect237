import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import styles from './NotificationBell.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const dropdownRef = useRef(null);

  // Socket avec callback pour les notifications
  const { isConnected, joinPersonalRoom } = useSocket(
    () => {}, // onNewMessage
    () => {}, // onMessageEdited
    () => {}, // onMessageDeleted
    () => {}, // onTyping
    (notification) => {
      // Nouvelle notification reçue en temps réel
      console.log('🔔 Nouvelle notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Jouer un son (optionnel)
      // const audio = new Audio('/notification.mp3');
      // audio.play();
    }
  );

  // Rejoindre la room personnelle
  useEffect(() => {
    if (isConnected && user) {
      console.log('📡 Rejoint la room personnelle pour les notifications');
      joinPersonalRoom();
    }
  }, [isConnected, user, joinPersonalRoom]);

  // Charger les notifications
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(`${API}/notifications`);
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    
    fetchNotifications();
  }, [user]);

  // Fermeture du dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'message': return '💬';
      case 'like': return '❤️';
      case 'comment': return '💭';
      case 'follow': return '👥';
      case 'mention': return '@';
      default: return '🔔';
    }
  };

  const getMessage = (notif) => {
    const senderName = notif.sender?.name || 'Quelqu\'un';
    
    switch (notif.type) {
      case 'message':
        return `${senderName}: "${notif.message?.substring(0, 50)}${notif.message?.length > 50 ? '...' : ''}"`;
      case 'like':
        return `${senderName} a aimé votre publication`;
      case 'comment':
        return `${senderName} a commenté votre publication`;
      case 'follow':
        return `${senderName} a commencé à vous suivre`;
      case 'mention':
        return `${senderName} vous a mentionné`;
      default:
        return notif.message || 'Nouvelle notification';
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/read/all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API}/notifications/${id}`);
      const deleted = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleClick = (notif) => {
    if (!notif.read) markAsRead(notif._id);
    setIsOpen(false);
    
    if (notif.type === 'message') {
      navigate('/messages');
    } else if (notif.post) {
      navigate(`/post/${notif.post}`);
    } else if (notif.type === 'follow') {
      navigate(`/profile/${notif.sender?._id}`);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 172800000) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  return (
    <div className={styles.bellContainer} ref={dropdownRef}>
      <button 
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className={styles.markAllRead}>
                Tout lire
              </button>
            )}
          </div>

          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Toutes
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'unread' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('unread')}
            >
              Non lues
              {unreadCount > 0 && <span className={styles.tabBadge}>{unreadCount}</span>}
            </button>
          </div>

          <div className={styles.list}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <span>🔕</span>
                <p>Aucune notification</p>
              </div>
            ) : (
              filtered.map(n => (
                <div 
                  key={n._id} 
                  className={`${styles.item} ${!n.read ? styles.unread : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className={styles.icon}>{getIcon(n.type)}</div>
                  <div className={styles.content}>
                    <div className={styles.headerRow}>
                      <span className={styles.name}>{n.sender?.name || 'Notification'}</span>
                      <span className={styles.time}>{formatTime(n.createdAt)}</span>
                    </div>
                    <p className={styles.message}>{getMessage(n)}</p>
                  </div>
                  <button 
                    className={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}>
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}