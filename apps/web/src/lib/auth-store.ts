"use client";

import { create } from "zustand";
import { api } from "./api";

const REFRESH_KEY = "nexora.refresh";

export type WalletView = { currency: "GOLD" | "NEX"; balance: string };

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  hasCharacter?: boolean;
  appearanceConfirmed?: boolean;
  wallets?: WalletView[];
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  ready: boolean;
  setSession: (accessToken: string, refreshToken: string, user?: AuthUser) => void;
  clearSession: () => void;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  ready: false,
  setSession(accessToken, refreshToken, user) {
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
    set({ accessToken, user: user ?? get().user });
  },
  clearSession() {
    sessionStorage.removeItem(REFRESH_KEY);
    set({ accessToken: null, user: null });
  },
  async hydrate() {
    const refreshToken = sessionStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      set({ ready: true });
      return;
    }

    try {
      const tokens = await api<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
        method: "POST",
        body: { refreshToken },
      });
      sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
      const user = await api<AuthUser>("/auth/me", { accessToken: tokens.accessToken });
      set({ accessToken: tokens.accessToken, user, ready: true });
    } catch {
      sessionStorage.removeItem(REFRESH_KEY);
      set({ accessToken: null, user: null, ready: true });
    }
  },
}));

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY);
}
