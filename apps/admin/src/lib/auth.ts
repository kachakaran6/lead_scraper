const TOKEN_KEY = "leadengine_admin_token";
const USER_KEY = "leadengine_admin_user";

export interface StoredAdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  accountStatus?: string;
  scraperAccess?: boolean;
}

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getUser(): StoredAdminUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setUser(user: StoredAdminUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return Boolean(token && user && (user.role === "ADMIN" || user.role === "OWNER"));
  },
};

export const isAuthenticated = (): boolean => authStorage.isAuthenticated();
export const isAdmin = (): boolean => {
  const user = authStorage.getUser();
  return Boolean(user && (user.role === "ADMIN" || user.role === "OWNER"));
};
export const getStoredUser = (): StoredAdminUser | null => authStorage.getUser();
export const saveAuthSession = (token: string, user: StoredAdminUser): void => {
  authStorage.setToken(token);
  authStorage.setUser(user);
};
export const clearAuthSession = (): void => authStorage.clear();
