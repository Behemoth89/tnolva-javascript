import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './NavBar.module.css';

export function NavBar() {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  const isAuthenticated = status === 'authenticated' && user !== null;
  const isAdmin = user?.is_admin === 1;

  async function handleLogout() {
    setPending(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      // ignore: best-effort logout
    } finally {
      setPending(false);
    }
  }

  return (
    <nav aria-label="Primary" data-testid="nav-bar" className={styles.nav}>
      <Link to="/" data-testid="nav-home-link" className={styles.brand}>
        Chat Interface
      </Link>
      <ul className={styles.list}>
        {isAuthenticated && (
          <li>
            <NavLink
              to="/chat"
              data-testid="nav-chat-link"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles['link--active']}` : styles.link
              }
            >
              Chat
            </NavLink>
          </li>
        )}
        {isAdmin && (
          <>
            <li>
              <NavLink
                to="/admin"
                data-testid="nav-admin-link"
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles['link--active']}` : styles.link
                }
              >
                Admin
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/llm-providers"
                data-testid="nav-llm-providers-link"
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles['link--active']}` : styles.link
                }
              >
                LLM providers
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/llm-provider-models"
                data-testid="nav-llm-provider-models-link"
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles['link--active']}` : styles.link
                }
              >
                LLM models
              </NavLink>
            </li>
          </>
        )}
        {isAuthenticated ? (
          <li>
            <button
              type="button"
              onClick={handleLogout}
              disabled={pending}
              data-testid="nav-logout"
              className={styles.logout}
            >
              {pending ? 'Logging out…' : 'Logout'}
            </button>
          </li>
        ) : (
          <>
            <li>
              <Link to="/login" data-testid="nav-login-link" className={styles.link}>
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" data-testid="nav-register-link" className={styles.link}>
                Register
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default NavBar;
