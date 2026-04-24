import { create } from "zustand";
import { getStorage, setStorage, removeStorage } from "@/hooks/use-local-storage";

// ----------------------------------------------------------------------

const USER_KEY = "auth-user";
const TOKEN_KEY = "auth-token";

/** Minimal user shape — extend as needed for your project */
export type User = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role?: string;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** Persist user in localStorage and update store */
  setUser: (user: User | null) => void;
  /** Persist token in localStorage and update store */
  setToken: (token: string | null) => void;
  /** Clear all auth state + localStorage */
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Restore from localStorage on init (SSR-safe)
  user: (typeof window !== "undefined" ? getStorage(USER_KEY) : null) as User | null,
  token: (typeof window !== "undefined" ? getStorage(TOKEN_KEY) : null) as string | null,
  isAuthenticated: typeof window !== "undefined" ? !!getStorage(TOKEN_KEY) : false,

  setUser: (user) => {
    if (user) setStorage(USER_KEY, user);
    else removeStorage(USER_KEY);
    set({ user, isAuthenticated: !!user });
  },

  setToken: (token) => {
    if (token) setStorage(TOKEN_KEY, token);
    else removeStorage(TOKEN_KEY);
    set({ token, isAuthenticated: !!token });
  },

  logout: () => {
    removeStorage(USER_KEY);
    removeStorage(TOKEN_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
