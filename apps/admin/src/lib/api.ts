import axios from "axios";
import { authStorage } from "./auth";
import {
  AdminStats,
  AdminUserItem,
  AuditLogItem,
  UserRole,
} from "../types/admin";

// Create Axios Instance
// In development: /api proxies to localhost:4000
// In production: Nginx proxies /api/* to http://api:4000/*
export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401/403 session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStorage.clear();
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  // Authentication
  async login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    const { user, token } = res.data;

    if (user.role !== "ADMIN" && user.role !== "OWNER") {
      throw new Error("Access denied: You must be an administrator or owner to access this portal.");
    }

    if (user.accountStatus && user.accountStatus !== "ACTIVE") {
      throw new Error(`Access denied: Your account is currently ${user.accountStatus.toLowerCase()}.`);
    }

    authStorage.setToken(token);
    authStorage.setUser(user);
    return { user, token };
  },

  async logout() {
    authStorage.clear();
  },

  // Stats
  async getStats(): Promise<AdminStats> {
    const res = await api.get("/admin/stats");
    return res.data;
  },

  // User Management
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    scraperAccess?: boolean;
    role?: string;
  }): Promise<{
    users: AdminUserItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await api.get("/admin/users", { params });
    return res.data;
  },

  async getUserById(id: string): Promise<{
    user: AdminUserItem & {
      failedLoginAttempts: number;
      counts: Record<string, number>;
    };
    auditLogs: AuditLogItem[];
  }> {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  async approveUser(id: string): Promise<AdminUserItem> {
    const res = await api.post(`/admin/users/${id}/approve`);
    return res.data;
  },

  async enableUser(id: string): Promise<AdminUserItem> {
    const res = await api.post(`/admin/users/${id}/enable`);
    return res.data;
  },

  async disableUser(id: string, reason?: string): Promise<AdminUserItem> {
    const res = await api.post(`/admin/users/${id}/disable`, { reason });
    return res.data;
  },

  async suspendUser(id: string, reason?: string): Promise<AdminUserItem> {
    const res = await api.post(`/admin/users/${id}/suspend`, { reason });
    return res.data;
  },

  async grantScraperAccess(id: string): Promise<AdminUserItem> {
    const res = await api.post(`/admin/users/${id}/grant-access`);
    return res.data;
  },

  async revokeScraperAccess(id: string, reason?: string): Promise<AdminUserItem> {
    const res = await api.post(`/admin/users/${id}/revoke-access`, { reason });
    return res.data;
  },

  async changeRole(id: string, role: UserRole): Promise<AdminUserItem> {
    const res = await api.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },

  // Audit Logs
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
  }): Promise<{
    logs: AuditLogItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await api.get("/admin/audit-logs", { params });
    return res.data;
  },
};
