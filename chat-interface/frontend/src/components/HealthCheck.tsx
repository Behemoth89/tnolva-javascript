import { useCallback, useEffect, useState } from 'react';
import { fetchHealth } from '../api/health';
import type { HealthResponse } from '../types/health';
import styles from './HealthCheck.module.css';

type Status = 'idle' | 'loading' | 'ok' | 'error';

function formatUptime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h ${m}m ${s}s`;
}

export function HealthCheck() {
  const [status, setStatus] = useState<Status>('idle');
  const [uptime, setUptime] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data: HealthResponse = await fetchHealth();
      setUptime(data.uptime);
      setTimestamp(data.timestamp);
      setStatus('ok');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isLoading = status === 'loading';

  const badgeClass =
    status === 'ok'
      ? `${styles.badge} ${styles['badge--ok']}`
      : status === 'error'
      ? `${styles.badge} ${styles['badge--error']}`
      : styles.badge;

  return (
    <section aria-labelledby="health-title" data-testid="health-check" className={styles.page}>
      <h1 id="health-title" className={styles.title}>Backend Health</h1>
      <div>
        <span
          data-testid="status-badge"
          data-status={status}
          className={badgeClass}
        >
          {status === 'ok' ? 'Online' : status === 'error' ? 'Offline' : status === 'loading' ? 'Loading' : 'Idle'}
        </span>
      </div>
      <dl className={styles.meta}>
        <dt>Uptime</dt>
        <dd data-testid="uptime">{uptime != null ? formatUptime(uptime) : '—'}</dd>
        <dt>Last checked</dt>
        <dd data-testid="timestamp">{timestamp ?? '—'}</dd>
        {error && (
          <>
            <dt>Error</dt>
            <dd data-testid="error" role="alert" className={styles.error}>{error}</dd>
          </>
        )}
      </dl>
      <button type="button" onClick={load} disabled={isLoading} data-testid="refresh" className={styles.refresh}>
        {isLoading ? 'Refreshing…' : 'Refresh'}
      </button>
    </section>
  );
}

export default HealthCheck;
