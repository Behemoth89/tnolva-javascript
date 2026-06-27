import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './Register.module.css';

const MIN_PASSWORD_LENGTH = 8;

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setPending(true);
    try {
      await register(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="register-title" data-testid="register-page" className={styles.page}>
      <h1 id="register-title" className={styles.title}>Create account</h1>
      <form onSubmit={onSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="register-email" className={styles.label}>Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            data-testid="register-email"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="register-password" className={styles.label}>Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            data-testid="register-password"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="register-confirm" className={styles.label}>Confirm password</label>
          <input
            id="register-confirm"
            name="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            data-testid="register-confirm"
            className={styles.input}
          />
        </div>
        {error && (
          <p role="alert" data-testid="register-error" className={styles.error}>
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} data-testid="register-submit" className={styles.submit}>
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className={styles.alt}>
        Already have an account? <Link to="/login" data-testid="register-login-link">Sign in</Link>
      </p>
    </section>
  );
}

export default Register;
