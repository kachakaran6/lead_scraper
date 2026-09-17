export type AppRole = "owner" | "admin" | "manager" | "member" | "viewer";

export type AppAction =
  | "LEADS_VIEW"
  | "LEADS_CREATE"
  | "LEADS_EDIT"
  | "LEADS_DELETE"
  | "DISCOVERY_RUN"
  | "DEALS_MANAGE"
  | "CAMPAIGNS_MANAGE"
  | "SCORING_RULES_EDIT"
  | "USERS_MANAGE"
  | "ROLES_MANAGE"
  | "ADMIN_STATS_VIEW"
  | "API_KEYS_MANAGE"
  | "SYSTEM_SETTINGS_EDIT"
  | "BILLING_MANAGE"
  | "WORKSPACE_DELETE";

export interface UserContext {
  id?: string;
  role: string;
  email?: string;
  workspaceId?: string;
}

export const ROLE_PERMISSIONS: Record<AppRole, AppAction[]> = {
  owner: [
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
  admin: [
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
  manager: [
    "LEADS_VIEW",
    "LEADS_CREATE",
    "LEADS_EDIT",
    "DISCOVERY_RUN",
    "DEALS_MANAGE",
    "CAMPAIGNS_MANAGE",
    "ADMIN_STATS_VIEW",
  ],
  member: [
    "LEADS_VIEW",
    "LEADS_CREATE",
    "LEADS_EDIT",
    "DISCOVERY_RUN",
    "DEALS_MANAGE",
  ],
  viewer: [
    "LEADS_VIEW",
  ],
};

/**
 * Pure authorization check function unit-testable independent of HTTP.
 */
export function can(userOrRole: string | UserContext | undefined, action: AppAction, resource?: any): boolean {
  if (!userOrRole) return false;

  const rawRole = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  if (!rawRole) return false;

  const normalizedRole = rawRole.toLowerCase() as AppRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole];
  if (!permissions) return false;

  return permissions.includes(action);
}

/**
 * Returns all permissions and capability flags for a given role.
 */
export function getRoleCapabilities(role: string = "member") {
  const normalizedRole = role.toLowerCase() as AppRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.member;

  return {
    role: normalizedRole,
    permissions,
    canViewLeads: permissions.includes("LEADS_VIEW"),
    canRunDiscovery: permissions.includes("DISCOVERY_RUN"),
    canEditScoring: permissions.includes("SCORING_RULES_EDIT"),
    canManageUsers: permissions.includes("USERS_MANAGE"),
    canViewAdminStats: permissions.includes("ADMIN_STATS_VIEW"),
    canManageApiKeys: permissions.includes("API_KEYS_MANAGE"),
    canManageBilling: permissions.includes("BILLING_MANAGE"),
    canEditSystemSettings: permissions.includes("SYSTEM_SETTINGS_EDIT"),
  };
}
