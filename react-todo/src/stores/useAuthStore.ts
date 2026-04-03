import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, SetAuthPayload } from '../types/auth';

interface AuthStore extends AuthState {
  setAuth: (payload: SetAuthPayload) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      firstName: null,
      lastName: null,
      isAuthenticated: false,

      setAuth: (payload: SetAuthPayload) =>
        set({
          token: payload.token,
          refreshToken: payload.refreshToken,
          firstName: payload.firstName,
          lastName: payload.lastName,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          token: null,
          refreshToken: null,
          firstName: null,
          lastName: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
