"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useStore } from "zustand";
import { createAuthStore } from "@/app/store/useAuthStore";

export const AuthContext = createContext<
  ReturnType<typeof createAuthStore> | undefined
>(undefined);

function getJwtExpMillis(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonPayload = atob(padded);
    const payload = JSON.parse(jsonPayload);
    if (typeof payload?.exp !== "number") return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<ReturnType<typeof createAuthStore> | undefined>(undefined);

  useEffect(() => {
    setStore(createAuthStore());
  }, []);

  useEffect(() => {
    if (!store) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;

    const clearScheduled = () => {
      if (timeout) clearTimeout(timeout);
      timeout = undefined;
    };

    const scheduleRefresh = () => {
      clearScheduled();

      const { user, refreshAccessToken } = store.getState();
      if (!user?.access_token) return;

      const expMillis = getJwtExpMillis(user.access_token);
      if (!expMillis) return;

      // Refresh 60s before token expiry to avoid mid-request 401s.
      const refreshAt = expMillis - 60_000;
      const now = Date.now();
      const delay = refreshAt - now;

      if (delay <= 0) {
        void refreshAccessToken();
        return;
      }

      timeout = setTimeout(() => {
        void refreshAccessToken();
      }, delay);
    };

    // Initial scheduling + reschedule when access token changes (including zustand rehydration).
    scheduleRefresh();
    const unsubscribe = store.subscribe(
      (state) => state.user?.access_token,
      () => scheduleRefresh()
    );

    const onFocusOrVisible = () => {
      const { user } = store.getState();
      if (!user?.access_token) return;

      const expMillis = getJwtExpMillis(user.access_token);
      if (!expMillis) return;

      if (Date.now() >= expMillis - 60_000) scheduleRefresh();
    };

    document.addEventListener("visibilitychange", onFocusOrVisible);
    window.addEventListener("focus", onFocusOrVisible);

    return () => {
      clearScheduled();
      unsubscribe();
      document.removeEventListener("visibilitychange", onFocusOrVisible);
      window.removeEventListener("focus", onFocusOrVisible);
    };
  }, [store]);

  if (!store) return null; // or a loading indicator

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return useStore(context);
};