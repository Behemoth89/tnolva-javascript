import { createApiClient } from './apiClient';
import axios from 'axios';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      token: 'test-token',
      refreshToken: 'test-refresh-token',
      firstName: 'Test',
      lastName: 'User',
      clearAuth: vi.fn(),
      setAuth: vi.fn(),
    })),
  },
}));

describe('createApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an axios instance with baseURL from env', () => {
    const client = createApiClient();
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 10000,
    });
    expect(client).toBeDefined();
  });

  it('registers request interceptor', () => {
    createApiClient();
    const mockInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(mockInstance.interceptors.request.use).toHaveBeenCalled();
  });

  it('registers response interceptor', () => {
    createApiClient();
    const mockInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(mockInstance.interceptors.response.use).toHaveBeenCalled();
  });
});
