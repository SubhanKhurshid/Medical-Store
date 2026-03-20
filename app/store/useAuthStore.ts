import { createStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { getApiBaseUrl } from "@/lib/api";

// Auth State Interface
interface AuthState {
  user: {
    name: string;
    email: string;
    role: string;
    access_token: string;
    refresh_token: string;
    image: string;
  } | null;
  login: (
    email: string,
    password: string
  ) => Promise<{
    name: string;
    email: string;
    role: string;
    access_token: string;
    refresh_token: string;
  } | null>;
  refreshAccessToken: () => Promise<boolean>;
  logout: () => void;
}


export const createAuthStore = () => {
  return createStore<AuthState>()(
    persist(
      (set, get) => ({
        user: null,
        login: async (email, password) => {
          if (typeof window === "undefined") {
            console.log("Login attempted during SSR; skipping");
            return null;
          }

          try {
            const response = await axios.post(
              `${getApiBaseUrl()}/auth/login`,
              { email, password }
            );
            const userData = { ...response.data };
            set({ user: userData });
            return userData;
          } catch (error) {
            console.error("Login Error: ", error);
            return null;
          }
        },
        refreshAccessToken: async () => {
          if (typeof window === "undefined") return false;

          const currentUser = get().user;
          const refreshToken = currentUser?.refresh_token;
          if (!refreshToken) return false;

          try {
            const response = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            const newAccessToken = response.data?.access_token;
            if (!newAccessToken) return false;

            set({
              user: currentUser
                ? {
                    ...currentUser,
                    access_token: newAccessToken,
                  }
                : null,
            });

            return true;
          } catch (error) {
            // If refresh fails (expired/invalid), clear user so UI can recover.
            set({ user: null });
            return false;
          }
        },
        logout: () => {
          if (typeof window === "undefined") {
            console.log("Logout attempted during SSR; skipping");
            return;
          }
          set({ user: null });
        },
      }),
      {
        name: "auth-storage",
        storage: createJSONStorage(() => localStorage), // Change to localStorage
      }
    )
  );
};

