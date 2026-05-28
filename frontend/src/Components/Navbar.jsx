import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Css/Navbar.module.css';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      {/* Logo */}
      <Link to="/feed" className={styles.logo}>
        <div className={styles.logoIcon}>EC</div>
        <span className={styles.logoText}>EnterpriseConnect</span>
      </Link>

      {/* Barre de recherche */}
      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher collègues, groupes, publications..."
          className={styles.searchInput}
        />
      </div>

      {/* Actions à droite */}
      <div className={styles.rightSection}>
        
        {/* 🔔 Notifications */}
        <div className={styles.notificationWrapper}>
          <NotificationBell />
        </div>

        {/* 💬 Messages */}
        <Link to="/messages" className={styles.actionBtn}>
          <span className={styles.actionIcon}>💬</span>
          <span className={styles.actionLabel}>Messages</span>
        </Link>

        {/* 👤 Profil utilisateur */}
        <Link to={`/profile/${user?._id}`} className={styles.profileBtn}>
          <div className={styles.avatar}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.userName}>
              {user?.name?.split(' ')[0]}
            </span>
            <span className={styles.userRole}>
              {user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Employé'}
            </span>
          </div>
        </Link>

        {/* 🚪 Déconnexion */}
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <span className={styles.logoutIcon}>⎋</span>
          <span className={styles.logoutText}>Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}