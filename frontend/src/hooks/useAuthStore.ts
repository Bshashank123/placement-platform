import { create } from "zustand";
import { User } from "@/types";
import { api } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token?: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user: User, token?: string) => {
    // token is no longer needed in localStorage since it's in an HttpOnly cookie
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user, token: token || null, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout error", e);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = "/auth/login";
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    
    // We only check if user info is cached to render the UI quickly.
    // The actual token validation happens on the next API call (or via /auth/me).
    const raw = localStorage.getItem("user");
    
    if (raw) {
      try {
        const user = JSON.parse(raw);
        set({ user, token: null, isAuthenticated: true });
      } catch (e) {
        set({ user: null, token: null, isAuthenticated: false });
      }
    } else {
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
