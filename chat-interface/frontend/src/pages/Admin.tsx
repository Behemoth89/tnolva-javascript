import { useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import type { PublicUser } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import styles from './Admin.module.css';

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
      <section aria-labelledby="admin-title" data-testid="admin-denied" className={styles.page}>
        <h1 id="admin-title" className={styles.title}>Admin</h1>
        <p role="alert" data-testid="admin-denied-message" className={styles.denied}>
          Admin privileges required.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="admin-title" data-testid="admin-page" className={styles.page}>
      <h1 id="admin-title" className={styles.title}>Admin</h1>
      <h2 className={styles.subtitle}>Registered users</h2>
      {loading && <p data-testid="admin-loading" className={styles.loading}>Loading users…</p>}
      {error && (
        <p role="alert" data-testid="admin-error" className={styles.error}>
          {error}
        </p>
      )}
      {users && !loading && !error && (
        <table data-testid="admin-users-table" className={styles.table}>
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
