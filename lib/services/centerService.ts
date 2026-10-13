import { api } from "@/lib/apiClient";
import { CenterUser, CenterTeacher, StaffUser, CenterDashboardData, StaffPermission, CenterFinancialReport, CenterRoom, CenterAuditEntry } from "@/lib/types";

// ── SWR Cache Keys ─────────────────────────────────────────────────────────────
export const CENTER_TEACHERS_KEY = "/centers/me/teachers";
export const CENTER_ASSISTANTS_KEY = "/centers/me/staff";

export const CenterService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  async getDashboard(): Promise<CenterDashboardData> {
    return api.get<CenterDashboardData>("/centers/me/dashboard");
  },

  // ── Teachers ───────────────────────────────────────────────────────────────
  async getTeachers(): Promise<CenterTeacher[]> {
    return api.get<CenterTeacher[]>("/centers/me/teachers");
  },

  async createTeacher(data: { name: string; email: string; password: string; phone?: string; subject?: string; }): Promise<CenterTeacher> {
    return api.post<CenterTeacher>("/centers/me/teachers", data);
  },

  async updateTeacher(teacherId: string, data: Partial<CenterTeacher> & { is_active?: boolean }): Promise<CenterTeacher> {
    return api.patch<CenterTeacher>(`/centers/me/teachers/${teacherId}`, data);
  },

  async resetTeacherPassword(teacherId: string, password: string): Promise<void> {
    await api.patch(`/centers/me/teachers/${teacherId}/reset-password`, { password });
  },

  async getTeacherStats(teacherId: string): Promise<{
    students_count: number;
    suspended_count: number;
    active_students_count: number;
    groups_count: number;
    sessions_this_month: number;
    attendance_rate: number | null;
    present_count: number;
    absent_count: number;
    groups: { id: string; name: string; day_of_week: string; time: string; students_count: number }[];
    recent_students: { id: string; name: string; group_id: string | null; group_name: string | null; is_suspended: boolean; created_at: string }[];
  }> {
    return api.get(`/centers/me/teachers/${teacherId}/stats`);
  },

  async removeTeacher(teacherId: string): Promise<void> {
    await api.delete(`/centers/me/teachers/${teacherId}`);
  },

  // ── Assistants (staff linked to a teacher) ─────────────────────────────────
  async getAssistants(params?: {
    teacher_id?: string;
    search?: string;
    status?: "active" | "inactive";
    page?: number;
    limit?: number;
  }): Promise<{ data: StaffUser[]; total: number; page: number; pages: number; limit: number }> {
    const q = new URLSearchParams();
    if (params?.teacher_id) q.set("teacher_id", params.teacher_id);
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return api.get(`/centers/me/staff${qs ? `?${qs}` : ""}`);
  },

  async createAssistant(data: {
    name: string;
    email: string;
    password: string;
    teacher_id: string;
  }): Promise<StaffUser> {
    return api.post<StaffUser>("/centers/me/staff", data);
  },

  async updateAssistant(staffId: string, data: { name?: string }): Promise<StaffUser> {
    return api.patch<StaffUser>(`/centers/me/staff/${staffId}`, data);
  },

  async toggleAssistantStatus(staffId: string): Promise<{ is_active: boolean }> {
    return api.patch(`/centers/me/staff/${staffId}/toggle-status`, {});
  },

  async resetAssistantPassword(staffId: string, password: string): Promise<void> {
    await api.patch(`/centers/me/staff/${staffId}/reset-password`, { password });
  },

  async deleteAssistant(staffId: string): Promise<void> {
    await api.delete(`/centers/me/staff/${staffId}`);
  },

  async transferAssistant(staffId: string, teacher_id: string): Promise<void> {
    await api.patch(`/centers/me/staff/${staffId}/transfer`, { teacher_id });
  },

  async getFinancialReport(params?: { teacher_id?: string; from?: string; to?: string }): Promise<CenterFinancialReport> {
    const query = new URLSearchParams();
    if (params?.teacher_id) query.set("teacher_id", params.teacher_id);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString();
    return api.get<CenterFinancialReport>(`/centers/me/financial-report${qs ? `?${qs}` : ""}`);
  },

  // ── Center info update ─────────────────────────────────────────────────────────────
  async updateInfo(data: Partial<Pick<CenterUser, "name" | "manager_name" | "phone" | "whatsapp" | "address" | "governorate">>): Promise<CenterUser> {
    return api.patch<CenterUser>("/centers/me/info", data);
  },

  // ── Rooms ────────────────────────────────────────────────────────────────────────
  async getRooms(): Promise<CenterRoom[]> {
    return api.get<CenterRoom[]>("/centers/me/rooms");
  },
  async createRoom(data: { name: string; capacity: number }): Promise<CenterRoom> {
    return api.post<CenterRoom>("/centers/me/rooms", data);
  },
  async updateRoom(roomId: string, data: { name?: string; capacity?: number }): Promise<CenterRoom> {
    return api.patch<CenterRoom>(`/centers/me/rooms/${roomId}`, data);
  },
  async toggleRoom(roomId: string): Promise<{ is_active: boolean }> {
    return api.patch(`/centers/me/rooms/${roomId}/toggle`, {});
  },
  async deleteRoom(roomId: string): Promise<void> {
    await api.delete(`/centers/me/rooms/${roomId}`);
  },

  // ── Audit log ─────────────────────────────────────────────────────────────────────
  async getAuditLog(page = 1, limit = 20): Promise<{ data: CenterAuditEntry[]; total: number; pages: number }> {
    return api.get(`/centers/me/audit-log?page=${page}&limit=${limit}`);
  },

  // ── Legacy staff methods (kept for backward compat) ────────────────────────
  async getStaff(): Promise<StaffUser[]> {
    const res = await api.get<{ data: StaffUser[] }>("/centers/me/staff");
    return res.data;
  },

  async createStaff(data: { name: string; email: string; password: string; permissions: StaffPermission[]; teacher_id?: string }): Promise<StaffUser> {
    return api.post<StaffUser>("/centers/me/staff", data);
  },

  async updateStaff(staffId: string, data: Partial<StaffUser>): Promise<StaffUser> {
    return api.patch<StaffUser>(`/centers/me/staff/${staffId}`, data);
  },

  async resetStaffPassword(staffId: string, password: string): Promise<void> {
    await api.patch(`/centers/me/staff/${staffId}/reset-password`, { password });
  },

  async deleteStaff(staffId: string): Promise<void> {
    await api.delete(`/centers/me/staff/${staffId}`);
  },
};

// ── Admin: Centers management ──────────────────────────────────────────────────
export const AdminCentersService = {
  async getCenters(): Promise<(CenterUser & { teachers_count: number; assistants_count: number })[]> {
    return api.get("/centers");
  },

  async getCenterById(id: string): Promise<CenterUser & { teachers: CenterTeacher[]; staff: StaffUser[] }> {
    return api.get(`/centers/${id}`);
  },

  async createCenter(data: { name: string; email: string; password: string; phone?: string; address?: string }): Promise<CenterUser> {
    return api.post<CenterUser>("/centers", data);
  },

  async updateCenter(id: string, data: Partial<CenterUser>): Promise<CenterUser> {
    return api.patch<CenterUser>(`/centers/${id}`, data);
  },

  async toggleStatus(id: string): Promise<{ is_active: boolean }> {
    return api.patch(`/centers/${id}/status`, {});
  },

  async resetPassword(id: string, password: string): Promise<void> {
    await api.patch(`/centers/${id}/reset-password`, { password });
  },

  async deleteCenter(id: string): Promise<void> {
    await api.delete(`/centers/${id}`);
  },

  async getStats(id: string): Promise<{
    teachers_count: number; assistants_count: number; students_count: number;
    groups_count: number; today_present: number; today_absent: number;
  }> {
    return api.get(`/centers/${id}/stats`);
  },
};
