import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../api/client";
import { AuthContext } from "../../hooks/useAuth";
import type { User } from "../../types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const qc = useQueryClient();

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await apiClient.get("/auth/me/");
      setUser(data);
      if (data.organization) {
        localStorage.setItem("organization_id", String(data.organization));
      }
    } catch (err: unknown) {
      // Only 401/403 mean the session is genuinely invalid. Network errors
      // (timeouts, offline, Render cold-start) must NOT wipe valid tokens —
      // otherwise a sleeping backend silently logs the user out.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("organization_id");
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "access_token") {
        fetchUser();
      }
    };
    const handleSessionExpired = () => {
      localStorage.removeItem("organization_id");
      setUser(null);
      qc.clear();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [fetchUser, qc]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await apiClient.post("/auth/login/", {
      username,
      password,
    });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    setUser(data.user);
    if (data.user?.organization) {
      localStorage.setItem("organization_id", String(data.user.organization));
    }
    // Return the fresh user so callers can navigate role-aware without
    // waiting for this component's state to re-render.
    return data.user;
  }, []);

  const register = useCallback(
    async (userData: {
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
    }) => {
      const { data } = await apiClient.post("/auth/register/", userData);
      return data;
    },
    []
  );

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem("refresh_token");
    try {
      if (refresh) {
        await apiClient.post("/auth/logout/", { refresh });
      }
    } catch {
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("organization_id");
      setUser(null);
      qc.clear();
    }
  }, [qc]);

  const refetchUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refetchUser,
    }),
    [user, isLoading, login, register, logout, refetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
