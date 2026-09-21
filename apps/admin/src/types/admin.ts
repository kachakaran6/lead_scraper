export type AccountStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DISABLED";
export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type Role = UserRole;

export interface AdminUserItem {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  scraperAccess: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  suspendedAt: string | null;
  disabledAt: string | null;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    businesses: number;
    discoveryProfiles: number;
    exports: number;
  };
  // counts is the normalized alias used in admin API responses
  counts?: {
    businesses: number;
    discoveryProfiles: number;
    exports: number;
  };
}

export type AdminUser = AdminUserItem;

export interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  scraperActiveUsers: number;
  suspendedUsers: number;
  disabledUsers: number;
  totalAdmins: number;
  recentAuditLogsCount: number;
}

export interface AuditLogItem {
  id: string;
  adminUserId?: string | null;
  targetUserId?: string | null;
  action: string;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  adminUser?: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
  } | null;
  targetUser?: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
  } | null;
}

export type AdminAuditLog = AuditLogItem;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
