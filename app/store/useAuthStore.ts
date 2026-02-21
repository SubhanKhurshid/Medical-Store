import { createStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";

// Auth State Interface
interface AuthState {
  user: {
    name: string;
    email: string;
    role: string;
    access_token: string;
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
  } | null>;
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
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`,
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

