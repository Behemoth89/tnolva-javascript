import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

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
    <nav aria-label="Primary" data-testid="nav-bar">
      <Link to="/" data-testid="nav-home-link">Chat Interface</Link>
      <ul>
        <li>
          <Link to="/" data-testid="nav-root-link">Home</Link>
        </li>
        {isAdmin && (
          <li>
            <Link to="/admin" data-testid="nav-admin-link">Admin</Link>
          </li>
        )}
        {isAuthenticated ? (
          <li>
            <button
              type="button"
              onClick={handleLogout}
              disabled={pending}
              data-testid="nav-logout"
            >
              {pending ? 'Logging out…' : 'Logout'}
            </button>
          </li>
        ) : (
          <>
            <li>
              <Link to="/login" data-testid="nav-login-link">Login</Link>
            </li>
            <li>
              <Link to="/register" data-testid="nav-register-link">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default NavBar;
