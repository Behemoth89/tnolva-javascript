import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './Login.module.css';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="login-title" data-testid="login-page" className={styles.page}>
      <h1 id="login-title" className={styles.title}>Sign in</h1>
      <form onSubmit={onSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="login-email" className={styles.label}>Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            data-testid="login-email"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="login-password" className={styles.label}>Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            data-testid="login-password"
            className={styles.input}
          />
        </div>
        {error && (
          <p role="alert" data-testid="login-error" className={styles.error}>
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} data-testid="login-submit" className={styles.submit}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className={styles.alt}>
        New here? <Link to="/register" data-testid="login-register-link">Create an account</Link>
      </p>
    </section>
  );
}

export default Login;
