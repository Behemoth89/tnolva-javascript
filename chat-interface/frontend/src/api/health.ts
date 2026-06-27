import type { HealthResponse } from '../types/health';

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch('/api/health', { signal });
  if (!res.ok) {
    throw new Error(`Health request failed with status ${res.status}`);
  }
  const data = (await res.json()) as HealthResponse;
  if (typeof data?.status !== 'string' || typeof data?.uptime !== 'number' || typeof data?.timestamp !== 'string') {
    throw new Error('Health response missing required fields');
  }
  return data;
}
