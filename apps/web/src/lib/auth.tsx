import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

export type AppRole = "owner" | "admin" | "manager" | "member" | "viewer";

export interface RoleCapabilities {
  role: AppRole;
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
  role: AppRole;
  setRole: (role: AppRole) => void;
  capabilities: RoleCapabilities;
  can: (action: string) => boolean;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

const DEFAULT_CAPABILITIES: Record<AppRole, RoleCapabilities> = {
  owner: {
    role: "owner",
    permissions: [
      "LEADS_VIEW",
      "LEADS_CREATE",
      "LEADS_EDIT",
      "LEADS_DELETE",
      "DISCOVERY_RUN",
      "DEALS_MANAGE",
      "CAMPAIGNS_MANAGE",
      "SCORING_RULES_EDIT",
      "USERS_MANAGE",
      "ROLES_MANAGE",
      "ADMIN_STATS_VIEW",
      "API_KEYS_MANAGE",
      "SYSTEM_SETTINGS_EDIT",
      "BILLING_MANAGE",
      "WORKSPACE_DELETE",
    ],
    canViewLeads: true,
    canRunDiscovery: true,
    canEditScoring: true,
    canManageUsers: true,
    canViewAdminStats: true,
    canManageApiKeys: true,
    canManageBilling: true,
    canEditSystemSettings: true,
  },
  admin: {
    role: "admin",
    permissions: [
      "LEADS_VIEW",
      "LEADS_CREATE",
      "LEADS_EDIT",
      "LEADS_DELETE",
      "DISCOVERY_RUN",
      "DEALS_MANAGE",
      "CAMPAIGNS_MANAGE",
      "SCORING_RULES_EDIT",
      "USERS_MANAGE",
      "ROLES_MANAGE",
      "ADMIN_STATS_VIEW",
      "API_KEYS_MANAGE",
      "SYSTEM_SETTINGS_EDIT",
    ],
    canViewLeads: true,
    canRunDiscovery: true,
    canEditScoring: true,
    canManageUsers: true,
    canViewAdminStats: true,
    canManageApiKeys: true,
    canManageBilling: false,
    canEditSystemSettings: true,
  },
  manager: {
    role: "manager",
    permissions: [
      "LEADS_VIEW",
      "LEADS_CREATE",
      "LEADS_EDIT",
      "DISCOVERY_RUN",
      "DEALS_MANAGE",
      "CAMPAIGNS_MANAGE",
      "ADMIN_STATS_VIEW",
    ],
    canViewLeads: true,
    canRunDiscovery: true,
    canEditScoring: false,
    canManageUsers: false,
    canViewAdminStats: true,
    canManageApiKeys: false,
    canManageBilling: false,
    canEditSystemSettings: false,
  },
  member: {
    role: "member",
    permissions: [
      "LEADS_VIEW",
      "LEADS_CREATE",
      "LEADS_EDIT",
      "DISCOVERY_RUN",
      "DEALS_MANAGE",
    ],
    canViewLeads: true,
    canRunDiscovery: true,
    canEditScoring: false,
    canManageUsers: false,
    canViewAdminStats: false,
    canManageApiKeys: false,
    canManageBilling: false,
    canEditSystemSettings: false,
  },
  viewer: {
    role: "viewer",
    permissions: [
      "LEADS_VIEW",
    ],
    canViewLeads: true,
    canRunDiscovery: false,
    canEditScoring: false,
    canManageUsers: false,
    canViewAdminStats: false,
    canManageApiKeys: false,
    canManageBilling: false,
    canEditSystemSettings: false,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<AppRole>(() => {
    return (localStorage.getItem("leadengine-active-role") as AppRole) || "admin";
  });

  const [capabilities, setCapabilities] = useState<RoleCapabilities>(
    () => DEFAULT_CAPABILITIES[role] || DEFAULT_CAPABILITIES.admin
  );

  const setRole = (newRole: AppRole) => {
    setRoleState(newRole);
    localStorage.setItem("leadengine-active-role", newRole);
    setCapabilities(DEFAULT_CAPABILITIES[newRole]);
    // Configure axios header dynamically
    api.defaults.headers.common["x-user-role"] = newRole;
  };

  useEffect(() => {
    api.defaults.headers.common["x-user-role"] = role;
    
    // Fetch live capabilities from backend
    api.get("/auth/permissions", { headers: { "x-user-role": role } })
      .then((res) => {
        if (res.data) {
          setCapabilities(res.data);
        }
      })
      .catch(() => {
        setCapabilities(DEFAULT_CAPABILITIES[role]);
      });
  }, [role]);

  const can = (action: string) => {
    return capabilities.permissions.includes(action);
  };

  const user = {
    id: "usr-active",
    email: "lead.engineer@leadengine.io",
    name: "Vishal Chavda",
  };

  return (
    <AuthContext.Provider value={{ role, setRole, capabilities, can, user }}>
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
