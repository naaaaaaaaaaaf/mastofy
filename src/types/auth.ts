export interface AuthState {
  accessToken: string | null;
  instance: string | null;
}

export interface LoginCredentials {
  instance: string;
  code: string;
}