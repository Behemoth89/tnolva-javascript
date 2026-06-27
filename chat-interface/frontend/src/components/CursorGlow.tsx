import { useEffect, useRef } from 'react';
import styles from './CursorGlow.module.css';

export function CursorGlow() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const apply = () => {
      rafRef.current = null;
      const pending = pendingRef.current;
      const root = rootRef.current;
      if (!pending || !root) return;
      root.style.setProperty('--glow-x', `${pending.x}px`);
      root.style.setProperty('--glow-y', `${pending.y}px`);
    };

    const onMove = (event: MouseEvent) => {
      pendingRef.current = { x: event.clientX, y: event.clientY };
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(apply);
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={rootRef} data-testid="cursor-glow" className={styles['cursor-glow']} aria-hidden="true">
      <div className={styles['cursor-glow__radial']} />
    </div>
  );
}

export default CursorGlow;
