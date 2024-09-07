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

// Zustand Store Setup
export const createAuthStore = () => {
  return createStore<AuthState>()(
    persist(
      (set, get) => ({
        user: null,
        login: async (email, password) => {
          // Ensure this logic runs only on the client side
          if (typeof window === "undefined") {
            console.log("Login attempted during SSR; skipping");
            return null;
          }

          try {
            const response = await axios.post(
              "http://localhost:3000/auth/login",
              { email, password }
            );
            set({ user: { ...response.data } });
            return response.data;
          } catch (error) {
            console.error("Login Error: ", error);
            return null;
          }
        },
        logout: () => {
          // Ensure logout only runs on the client side
          if (typeof window === "undefined") {
            console.log("Logout attempted during SSR; skipping");
            return;
          }
          set({ user: null });
        },
      }),
      {
        name: "auth-storage",
        storage: createJSONStorage(() => sessionStorage), // Wrap sessionStorage with createJSONStorage
      }
    )
  );
};
