import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import styles from './Css/Sidebar.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const menuItems = [
  { icon: '🏠', label: 'Fil d\'actualité', path: '/feed' },
  { icon: '👤', label: 'Mon profil', path: '/profile/me' },
  { icon: '💬', label: 'Messages', path: '/messages' },
  { icon: '👥', label: 'Annuaire', path: '/annuaire' },
  { icon: '👥', label: 'Groupes', path: '/groups' },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Charger les groupes de l'utilisateur
  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const { data } = await axios.get(`${API}/groups?type=my`);
        setMyGroups(data);
      } catch (error) {
        console.error('Erreur chargement groupes:', error);
      }
    };
    
    if (user) {
      fetchMyGroups();
    }
  }, [user]);

  // Charger le nombre de messages non lus
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        // Messages non lus
        const messagesRes = await axios.get(`${API}/messages/unread/count`);
        setUnreadMessages(messagesRes.data.count || 0);
        
        // Notifications non lues
        const notifsRes = await axios.get(`${API}/notifications/unread/count`);
        setUnreadNotifications(notifsRes.data.count || 0);
      } catch (error) {
        console.error('Erreur chargement compteurs:', error);
      }
    };
    
    if (user) {
      fetchUnreadCounts();
    }
  }, [user]);

  return (
    <aside className={styles.sidebar}>
      {/* Menu principal */}
      <div className={styles.menuSection}>
        <h3 className={styles.sectionTitle}>MENU</h3>
        <ul className={styles.menuList}>
          {menuItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`${styles.menuLink} ${location.pathname === item.path ? styles.active : ''}`}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {item.label === 'Messages' && unreadMessages > 0 && (
                  <span className={styles.menuBadge}>{unreadMessages}</span>
                )}
                {item.label === 'Notifications' && unreadNotifications > 0 && (
                  <span className={styles.menuBadge}>{unreadNotifications}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Mes groupes (dynamiques depuis l'API) */}
      <div className={styles.groupsSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>MES GROUPES</h3>
          <Link to="/groups" className={styles.viewAllLink}>Voir tout</Link>
        </div>
        {myGroups.length === 0 ? (
          <div className={styles.noGroups}>
            <span>👥</span>
            <p>Aucun groupe</p>
            <Link to="/groups/id">Rejoindre un groupe</Link>
          </div>
        ) : (
          <ul className={styles.groupsList}>
            {myGroups.slice(0, 5).map(group => (
              <li key={group._id}>
                <Link to={`/groups/${group._id}`} className={styles.groupLink}>
                  <div className={styles.groupAvatar}>
                    {group.avatar ? (
                      <img src={group.avatar} alt={group.name} />
                    ) : (
                      <div className={styles.groupAvatarPlaceholder}>
                        {group.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className={styles.groupName}>{group.name}</span>
                  {group.unreadCount > 0 && (
                    <span className={styles.groupBadge}>{group.unreadCount}</span>
                  )}
                </Link>
              </li>
            ))}
            {myGroups.length > 5 && (
              <li>
                <Link to="/groups" className={styles.moreGroupsLink}>
                  + {myGroups.length - 5} autres groupes
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Bottom section */}
      <div className={styles.bottomSection}>
        <button onClick={logout} className={styles.logoutButton}>
          <span>⎋</span> Déconnexion
        </button>
      </div>
    </aside>
  );
}