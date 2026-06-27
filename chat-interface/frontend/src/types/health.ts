export interface HealthResponse {
  status: 'ok' | string;
  uptime: number;
  timestamp: string;
}
