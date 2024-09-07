// app/providers/AuthProvider.tsx
"use client";

import { createContext, ReactNode, useContext } from "react";
import { useStore } from "zustand";
import { createAuthStore } from "@/app/store/useAuthStore";

// Create a context for the Auth Store
export const AuthContext = createContext<
  ReturnType<typeof createAuthStore> | undefined
>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize Zustand store directly
  const store = createAuthStore();

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return useStore(context);
};
