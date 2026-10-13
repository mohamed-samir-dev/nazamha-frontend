import { api } from "@/lib/apiClient";
import { AttendanceRecord } from "@/lib/types";
import { AttendanceQueue } from "@/lib/offlineQueue";

export const AttendanceRepository = {
  async getAttendanceRecords(month: number, year: number): Promise<AttendanceRecord[]> {
    return api.get<AttendanceRecord[]>(`/attendance?month=${month}&year=${year}`);
  },

  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    return api.get<AttendanceRecord[]>(`/attendance?all=true`);
  },

  async getLastSessionAbsentees(): Promise<Record<string, { sessionDate: string; absentees: { id: string; name: string; code: string | null }[] }>> {
    return api.get(`/attendance/last-session-absentees`);
  },

  async getAllTimeAttendanceStats(): Promise<Record<string, { present: number; absent: number }>> {
    return api.get<Record<string, { present: number; absent: number }>>(`/attendance/all-time-stats`);
  },

  async addAttendanceRecord(record: Omit<AttendanceRecord, "id" | "created_at">): Promise<AttendanceRecord> {
    return api.post<AttendanceRecord>("/attendance", record);
  },

  async upsertAttendanceRecord(record: Omit<AttendanceRecord, "id" | "created_at">): Promise<void> {
    if (!navigator.onLine) {
      AttendanceQueue.add(record);
      return;
    }
    try {
      await api.post("/attendance", record);
    } catch (error: unknown) {
      // إذا كان الخطأ تعليق طالب، لا نحفظه في الـ queue ونرمي الخطأ للـ UI
      if (error instanceof Error && (error.message.includes("محظور") || error.message.includes("موقوف"))) {
        throw error;
      }
      // أي خطأ آخر (network, server) → نحفظ في الـ queue بصمت
      AttendanceQueue.add(record);
    }
  },

  async addAttendanceRecords(records: Omit<AttendanceRecord, "id" | "created_at">[]): Promise<AttendanceRecord[]> {
    const res = await api.post<AttendanceRecord[] | { data: AttendanceRecord[] } | null>("/attendance/bulk", { records });
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (typeof res === "object" && "data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  async deleteAttendanceRecord(id: string): Promise<void> {
    await api.delete(`/attendance/${id}`);
  },

  async autoMarkAbsent(group_id: string, session_date: string): Promise<number> {
    const res = await api.post<{ marked: number }>("/attendance/auto-absent", { group_id, session_date });
    return res.marked;
  },

  async batchAutoMarkAbsent(sessions: { group_id: string; session_date: string }[]): Promise<number> {
    const res = await api.post<{ marked: number }>("/attendance/auto-absent/batch", { sessions });
    return res.marked;
  },

  async syncQueue(): Promise<number> {
    const queue = AttendanceQueue.getAll();
    if (queue.length === 0) return 0;

    let synced = 0;
    // نبعت كل السجلات بـ bulk endpoint بدل loop فردي
    const records = queue.map(({ _queuedAt: _, ...r }) => r);
    try {
      await api.post("/attendance/bulk", { records });
      AttendanceQueue.clear();
      synced = records.length;
    } catch {
      // fallback: حاول كل سجل لوحده
      for (const { _queuedAt: _, ...record } of queue) {
        try {
          await api.post("/attendance", record);
          AttendanceQueue.remove(record.student_id, record.session_date!);
          synced++;
        } catch {
          // keep in queue
        }
      }
    }
    return synced;
  },
};
