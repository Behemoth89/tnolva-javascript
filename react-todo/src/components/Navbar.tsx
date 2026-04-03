import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/useAuthStore';

export function Navbar() {
  const navigate = useNavigate();
  const firstName = useAuthStore((state) => state.firstName);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      <span className="text-zinc-100 font-medium">Hi, {firstName}</span>
      <div className="flex items-center gap-4">
        <Link
          to="/settings"
          className="text-zinc-400 hover:text-amber-500 transition-colors"
        >
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
