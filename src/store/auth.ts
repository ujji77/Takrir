import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isGuest: boolean;
  setToken: (token: string) => void;
  setGuest: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isGuest: false,
  setToken: (token) => set({ token, isGuest: false }),
  setGuest: () => set({ token: null, isGuest: true }),
  clearAuth: () => set({ token: null, isGuest: false }),
}));
