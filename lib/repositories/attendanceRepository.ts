import { api } from "@/lib/apiClient";
import { AttendanceRecord } from "@/lib/types";
import { AttendanceQueue, OfflineCache } from "@/lib/offlineQueue";
import { appCache } from "@/lib/appCache";

export type AttendanceSaveResult = { state: "saved"; record: AttendanceRecord } | { state: "queued" };
export interface AttendanceBulkResult { data: AttendanceRecord[]; suspended_skipped: string[] }
let syncPromise: Promise<number> | null = null;
const broadcast = () => { if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel("attendance"); channel.postMessage("refresh"); channel.close(); } };

export const AttendanceRepository = {
  async revokeSubstitution(id:string,reason:string){await api.post(`/attendance/substitutions/${id}/revoke`,{reason});appCache.invalidate("allTimeAttendanceMap");broadcast();},
  isSyncing() { return syncPromise !== null; },
  async getAttendanceRecords(month: number, year: number): Promise<AttendanceRecord[]> {
    return api.get<AttendanceRecord[]>(`/attendance?month=${month}&year=${year}`);
  },

  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    const records: AttendanceRecord[] = [];
    let page = 1;
    while (true) {
      const result = await api.get<AttendanceRecord[]>(`/attendance?all=true&limit=1000&page=${page++}`);
      records.push(...result);
      if (result.length < 1000) return records;
    }
  },

  async getLastSessionAbsentees(): Promise<Record<string, { sessionDate: string; absentees: { id: string; name: string; code: string | null }[] }>> {
    return api.get(`/attendance/last-session-absentees`);
  },

  async getAllTimeAttendanceStats(): Promise<Record<string, { present: number; absent: number }>> {
    return api.get<Record<string, { present: number; absent: number }>>(`/attendance/all-time-stats`);
  },

  async addAttendanceRecord(record: Omit<AttendanceRecord, "id" | "created_at">): Promise<AttendanceRecord> {
    const result=await api.post<AttendanceRecord>("/attendance", record); OfflineCache.saveAttendanceRecords([result]); broadcast(); return result;
  },

  async upsertAttendanceRecord(record: Omit<AttendanceRecord, "id" | "created_at">): Promise<AttendanceSaveResult> {
    const generation = appCache.generation();
    if (!navigator.onLine) {
      if(record.cross_group_action)throw new Error("الحضور خارج المجموعة والتعويض يحتاجان اتصالًا بالخادم");
      AttendanceQueue.add(record);
      return { state: "queued" };
    }
    try {
      const saved = await api.post<AttendanceRecord>("/attendance", record);
      OfflineCache.saveAttendanceRecords([saved]);
      broadcast();
      return { state: "saved", record: saved };
    } catch (error: unknown) {
      // إذا كان الخطأ تعليق طالب، لا نحفظه في الـ queue ونرمي الخطأ للـ UI
      // Only an actual offline state can be queued. A lost online response is
      // uncertain and must be retried/reconciled, never announced as saved.
      if (record.cross_group_action || navigator.onLine || generation !== appCache.generation() || (error && typeof error === "object" && "status" in error)) throw error;
      AttendanceQueue.add(record); return { state: "queued" };
    }
  },

  async addAttendanceRecords(records: Omit<AttendanceRecord, "id" | "created_at">[]): Promise<AttendanceBulkResult> {
    const result = await api.post<AttendanceBulkResult>("/attendance/bulk", { records });
    if (!result || !Array.isArray(result.data)) throw new Error("تعذر تأكيد نتيجة التحضير؛ أعد تحميل الحصة للتحقق.");
    OfflineCache.saveAttendanceRecords(result.data);
    broadcast(); return result;
  },

  async deleteAttendanceRecord(id: string): Promise<void> {
    await api.delete(`/attendance/${id}`);
    OfflineCache.removeAttendanceRecord(id);
    broadcast();
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
    if (syncPromise) return syncPromise;
    syncPromise = AttendanceRepository.flushQueue().finally(() => { syncPromise = null; });
    return syncPromise;
  },

  async flushQueue(): Promise<number> {
    const queue = AttendanceQueue.getAll();
    if (queue.length === 0) return 0;

    let synced = 0;
    const generation = appCache.generation();
    for (let offset=0;offset<queue.length;offset+=1000) {
      if (generation !== appCache.generation()) break;
      const chunk=queue.slice(offset,offset+1000);
      const records=chunk.map(({_queuedAt,_queueId,_error,...record})=>record);
      try {
        const result=await AttendanceRepository.addAttendanceRecords(records);
        if(generation!==appCache.generation()) break;
        const saved=new Set(result.data.map(r=>`${r.student_id}|${r.scanner_session_date || r.session_date}`));
        const acknowledged=chunk.filter(r=>saved.has(`${r.student_id}|${r.session_date}`));
        AttendanceQueue.acknowledge(acknowledged);synced+=acknowledged.length;
        for(const record of chunk.filter(r=>!saved.has(`${r.student_id}|${r.session_date}`))) AttendanceQueue.reject(record,"لم يؤكد الخادم السجل؛ راجع إيقاف الطالب وأهلية الجلسة.");
      } catch(error) {
        if(generation!==appCache.generation())break;
        // A rejected batch may contain individually valid rows. Never retry a
        // lost network response in an unbounded per-row loop.
        if(error && typeof error === "object" && "status" in error && [400,409].includes(Number(error.status))) {
          for(let i=0;i<chunk.length;i+=4) await Promise.all(chunk.slice(i,i+4).map(async queued=>{
            if(generation!==appCache.generation())return;
            const {_queuedAt,_queueId,_error,...record}=queued;
            try { await api.post("/attendance",record); if(generation===appCache.generation()){AttendanceQueue.acknowledge([queued]);synced++;} }
            catch(err){if(generation===appCache.generation())AttendanceQueue.reject(queued,err instanceof Error?err.message:"تعذر رفع الحضور");}
          }));
        } else {
          for(const queued of chunk) AttendanceQueue.reject(queued,error instanceof Error?error.message:"تعذر رفع الحضور");
        }
      }
    }
    if (synced) broadcast();
    return synced;
  },
};
