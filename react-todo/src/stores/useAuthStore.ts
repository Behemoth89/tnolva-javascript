import { create } from 'zustand';
import type { AuthState, SetAuthPayload } from '../types/auth';

interface AuthStore extends AuthState {
  setAuth: (payload: SetAuthPayload) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  token: null,
  refreshToken: null,
  firstName: null,
  lastName: null,
  isAuthenticated: false,
  isLoading: false,

  setAuth: (payload: SetAuthPayload) =>
    set({
      token: payload.token,
      refreshToken: payload.refreshToken,
      firstName: payload.firstName,
      lastName: payload.lastName,
      isAuthenticated: true,
      isLoading: false,
    }),

  clearAuth: () =>
    set({
      token: null,
      refreshToken: null,
      firstName: null,
      lastName: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
