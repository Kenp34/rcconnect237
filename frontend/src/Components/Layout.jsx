import Navbar from './Navbar';
import Sidebar from './Sidebar';
import styles from './Css/Layout.module.css';

export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Navbar />
      <div className={styles.mainContainer}>
        <Sidebar />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}