import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  emailVerified?: boolean;
}

export interface RoleCapabilities {
  role: string;
  permissions: string[];
  canViewLeads: boolean;
  canRunDiscovery: boolean;
  canEditScoring: boolean;
  canManageUsers: boolean;
  canViewAdminStats: boolean;
  canManageApiKeys: boolean;
  canManageBilling: boolean;
  canEditSystemSettings: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  capabilities: RoleCapabilities | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("leadengine-jwt");
    } catch {
      return null;
    }
  });
  const [capabilities, setCapabilities] = useState<RoleCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Set auth bearer token header whenever token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("leadengine-jwt", token);
      localStorage.setItem("token", token);

      // Verify token and fetch profile
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
          setCapabilities(res.data.capabilities || null);
        })
        .catch(() => {
          // Token expired or invalid
          setUser(null);
          setToken(null);
          localStorage.removeItem("leadengine-jwt");
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      setCapabilities(null);
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("leadengine-jwt", res.data.token);
      localStorage.setItem("token", res.data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post("/auth/register", { name, email, password });
    if (res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("leadengine-jwt", res.data.token);
      localStorage.setItem("token", res.data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    }
  };

  const logout = () => {
    try {
      api.post("/auth/logout").catch(() => {});
    } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem("leadengine-jwt");
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
  };

  const can = (action: string) => {
    if (!capabilities?.permissions) return true; // Default permissive for authenticated users
    return capabilities.permissions.includes(action);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        capabilities,
        login,
        register,
        logout,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
