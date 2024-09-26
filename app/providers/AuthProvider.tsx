"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useStore } from "zustand";
import { createAuthStore } from "@/app/store/useAuthStore";

export const AuthContext = createContext<
  ReturnType<typeof createAuthStore> | undefined
>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<ReturnType<typeof createAuthStore> | undefined>(undefined);

  useEffect(() => {
    setStore(createAuthStore());
  }, []);

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