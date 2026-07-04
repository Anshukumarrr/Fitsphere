import { createContext, useContext } from "react";
import type { User } from "../types";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    gym_name: string;
    gym_city?: string;
    gym_state?: string;
    gym_address?: string;
    branch_name: string;
    branch_city?: string;
  }) => Promise<{ detail: string; email: string }>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
