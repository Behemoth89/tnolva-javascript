import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HealthCheck from '../src/components/HealthCheck';

function mockFetchOnce(payload: unknown, ok = true) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(payload), {
      status: ok ? 200 : 500,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

describe('HealthCheck component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders the online state when the backend returns ok', async () => {
    const fetchSpy = mockFetchOnce({
      status: 'ok',
      uptime: 3725,
      timestamp: '2026-06-27T10:00:00.000Z',
    });

    render(<HealthCheck />);

    const badge = await screen.findByTestId('status-badge');
    await waitFor(() => expect(badge).toHaveAttribute('data-status', 'ok'));
    expect(badge).toHaveTextContent(/online/i);
    expect(screen.getByTestId('uptime')).toHaveTextContent('1h 2m 5s');
    expect(screen.getByTestId('timestamp')).toHaveTextContent('2026-06-27T10:00:00.000Z');
    expect(fetchSpy).toHaveBeenCalledWith('/api/health', expect.objectContaining({}));
  });

  it('renders the offline state when the fetch rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network down'));

    render(<HealthCheck />);

    const badge = await screen.findByTestId('status-badge');
    await waitFor(() => expect(badge).toHaveAttribute('data-status', 'error'));
    expect(badge).toHaveTextContent(/offline/i);
    expect(screen.getByTestId('error')).toHaveTextContent('network down');
  });

  it('re-fetches when the Refresh button is clicked', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ status: 'ok', uptime: 10, timestamp: '2026-06-27T10:00:00.000Z' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValue(
        new Response(
          JSON.stringify({ status: 'ok', uptime: 75, timestamp: '2026-06-27T10:00:30.000Z' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    render(<HealthCheck />);

    await waitFor(() => expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'ok'));

    fireEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => expect(screen.getByTestId('uptime')).toHaveTextContent('0h 1m 15s'));
    expect(fetchMock).toHaveBeenCalled();
  });
});
