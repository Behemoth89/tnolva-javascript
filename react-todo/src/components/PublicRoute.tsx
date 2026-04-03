import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/useAuthStore';

export function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
