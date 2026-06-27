import { useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import type { PublicUser } from '../api/auth';
import { useAuth } from '../auth/AuthContext';

export function Admin() {
  const { user } = useAuth();
  const isAdmin = user?.is_admin === 1;
  const [users, setUsers] = useState<PublicUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    authApi
      .listUsers()
      .then((list) => {
        if (cancelled) return;
        setUsers(list);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load users');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <section aria-labelledby="admin-title" data-testid="admin-denied">
        <h1 id="admin-title">Admin</h1>
        <p role="alert" data-testid="admin-denied-message">
          Admin privileges required.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="admin-title" data-testid="admin-page">
      <h1 id="admin-title">Admin</h1>
      <h2>Registered users</h2>
      {loading && <p data-testid="admin-loading">Loading users…</p>}
      {error && (
        <p role="alert" data-testid="admin-error" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}
      {users && !loading && !error && (
        <table data-testid="admin-users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} data-testid="admin-user-row">
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.is_admin === 1 ? 'admin' : 'user'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Admin;
