import { mutate } from "swr";
import { api, resetAuthFailureGuard } from "@/lib/apiClient";
import { Teacher } from "@/lib/types";
import { appCache } from "@/lib/appCache";
import {AttendanceQueue} from "@/lib/offlineQueue";

interface AuthResponse {
  teacher: Teacher;
}

interface AdminAuthResponse {
  admin: { id: string; name: string; email: string; is_admin: boolean; is_super_admin: boolean };
}

interface CenterAuthResponse {
  center: { id: string; name: string; email: string; user_type: "center" };
}

interface StaffAuthResponse {
  staff: { id: string; name: string; email: string; center_id: string; permissions: string[]; user_type: "staff" };
}

const AUTH_CACHE_KEY = "teacher:me";

/**
 * Keys in localStorage that hold user-specific data.
 * These MUST be cleared on logout/session expiry to prevent
 * a new user from seeing a previous user's cached data.
 */
const USER_SPECIFIC_STORAGE_KEYS = [
  "ot_teacher",
  "ot_students",
  "ot_groups",
  "ot_grades",
  "ot_grades_owner",
  "ot_attendance_queue",
  "ot_attendance_context",
  "ot_attendance_records",
  "ot_last_sync",
  "ot_is_assistant",
  // legacy keys
  "ot_is_admin",
  "ot_token",
];

export const AuthService = {
  clearUserCache() {
    appCache.invalidate(AUTH_CACHE_KEY);
  },

  /**
   * Clear ALL user-specific caches — both in-memory (appCache) and
   * localStorage (OfflineCache keys). Safe to call from any context.
   * Does NOT clear static/public data like sys settings.
   */
  clearAllUserData() {
    // In-memory: clear authenticated user data
    appCache.clear();
    void mutate(() => true, undefined, { revalidate: false });
    if (typeof window !== "undefined") window.dispatchEvent(new Event("account-cache-cleared"));

    // localStorage: clear user-specific offline cache
    if (typeof window !== "undefined") {
      AttendanceQueue.archive();
      USER_SPECIFIC_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
    }

    // Reset 401 dedup guard so next login works cleanly
    resetAuthFailureGuard();
  },

  cacheAdminUser(admin: { id: string; name: string; email: string; is_admin: boolean; is_super_admin: boolean }) {
    appCache.set(AUTH_CACHE_KEY, { ...admin, user_type: "admin" }, 5 * 60 * 1000);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    AuthService.clearAllUserData();
    // Token is set as HttpOnly cookie by the server — do NOT store in localStorage
    const res = await api.post<AuthResponse & { token?: string }>("/auth/login", { email, password });
    return res;
  },

  async adminLogin(email: string, password: string): Promise<AdminAuthResponse> {
    AuthService.clearAllUserData();
    const res = await api.post<AdminAuthResponse & { token?: string }>("/auth/admin-login", { email, password });
    return res;
  },

  async centerLogin(email: string, password: string): Promise<CenterAuthResponse> {
    AuthService.clearAllUserData();
    const res = await api.post<CenterAuthResponse & { token?: string }>("/auth/center-login", { email, password });
    return res;
  },

  async staffLogin(email: string, password: string): Promise<StaffAuthResponse> {
    AuthService.clearAllUserData();
    const res = await api.post<StaffAuthResponse & { token?: string }>("/auth/staff-login", { email, password });
    return res;
  },

  async getUser(): Promise<Teacher | null> {
    const cached = appCache.get<Teacher>(AUTH_CACHE_KEY);
    if (cached) return cached;
    const user = await api.get<Teacher>("/auth/me").catch(() => null);
    if (user) { appCache.set(AUTH_CACHE_KEY, user, 5 * 60 * 1000); AttendanceQueue.restore(user.id); }
    return user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.patch("/auth/change-password", { currentPassword, newPassword });
  },

  async signOut(): Promise<void> {
    // Fire-and-forget the server logout — don't let it block cleanup
    await api.post("/auth/logout", {}).catch(() => {});
    AuthService.clearAllUserData();
    // Clear the client-side cookie set during login
    if (typeof window !== "undefined") {
      document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    }
  },
};
