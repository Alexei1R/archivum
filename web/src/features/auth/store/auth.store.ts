import { create } from "zustand";
import type { User } from "../types";

interface AuthStoreProps {
    isAuthenticated: boolean;
    user: null | User;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    setUser: (user: null | User) => void;
    reset: () => void;
}

const useAuthStore = create<AuthStoreProps>((set) => ({
    isAuthenticated: false,
    user: null,
    setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
    setUser: (user) => set({ user }),
    reset: () => set({ isAuthenticated: false, user: null }),
}));

export { useAuthStore };
