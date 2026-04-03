export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  firstName: string | null;
  lastName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SetAuthPayload {
  token: string;
  refreshToken: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  firstName: string;
  lastName: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
