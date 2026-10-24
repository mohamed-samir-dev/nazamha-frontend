import { Student, Group, Grade, AttendanceRecord } from "@/lib/types";
import type { SystemSettings } from "@/lib/services/systemSettingsService";
import type { Teacher } from "@/lib/types";
import type {AttendanceContext} from "@/lib/utils/attendancePeriod";

const KEYS = {
  students: "ot_students",
  groups: "ot_groups",
  grades: "ot_grades",
  queue: "ot_attendance_queue",
  lastSync: "ot_last_sync",
  teacher: "ot_teacher",
  sysSettings: "ot_sys_settings",
  gradesOwner: "ot_grades_owner",
  isAssistant: "ot_is_assistant",
};

export type QueuedRecord = Omit<AttendanceRecord, "id" | "created_at"> & {
  _queuedAt: string;
  _queueId?: string;
  _error?: string;
};

// ── Cache helpers ────────────────────────────────────────────────

export const OfflineCache = {
  saveAttendanceRecords(records:AttendanceRecord[]) {
    try {
      const merged=new Map([...OfflineCache.loadAttendanceRecords(),...records].map(r=>[`${r.teacher_id}|${r.student_id}|${r.group_id||""}|${r.session_date}`,r]));
      localStorage.setItem("ot_attendance_records",JSON.stringify([...merged.values()].sort((a,b)=>b.session_date.localeCompare(a.session_date)).slice(0,10000)));
    } catch { /* Attendance is confirmed by the server even if browser storage is full. */ }
  },
  loadAttendanceRecords():AttendanceRecord[] {try{return JSON.parse(localStorage.getItem("ot_attendance_records")||"[]");}catch{return [];}},
  replaceAttendanceMonth(teacherId:string,month:number,year:number,records:AttendanceRecord[]) {
    try {localStorage.setItem("ot_attendance_records",JSON.stringify(OfflineCache.loadAttendanceRecords().filter(r=>r.teacher_id!==teacherId || r.month!==month || r.year!==year)));OfflineCache.saveAttendanceRecords(records);}catch{}
  },
  removeAttendanceRecord(id:string) {try {localStorage.setItem("ot_attendance_records",JSON.stringify(OfflineCache.loadAttendanceRecords().filter(r=>r.id!==id)));}catch{}},
  replaceAttendanceSession(teacherId:string,groupId:string,date:string,records:AttendanceRecord[]) {
    try {const other=OfflineCache.loadAttendanceRecords().filter(r=>!(r.teacher_id===teacherId && ((r.group_id===groupId&&r.session_date===date)||(r.scanner_group_id===groupId&&r.scanner_session_date===date))));localStorage.setItem("ot_attendance_records",JSON.stringify(other));OfflineCache.saveAttendanceRecords(records);}catch{}
  },
  saveAttendanceContext(context:AttendanceContext) { localStorage.setItem("ot_attendance_context",JSON.stringify(context)); },
  loadAttendanceContext():AttendanceContext|null { try {return JSON.parse(localStorage.getItem("ot_attendance_context")||"null");}catch{return null;} },
  saveStudents(students: Student[]) {
    localStorage.setItem(KEYS.students, JSON.stringify(students));
  },
  loadStudents(): Student[] {
    try {
      const raw = localStorage.getItem(KEYS.students);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  saveGroups(groups: Group[]) {
    localStorage.setItem(KEYS.groups, JSON.stringify(groups));
  },
  loadGroups(): Group[] {
    try {
      const raw = localStorage.getItem(KEYS.groups);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  saveGrades(grades: Grade[], ownerId?: string) {
    localStorage.setItem(KEYS.grades, JSON.stringify(grades));
    if (ownerId) localStorage.setItem(KEYS.gradesOwner, ownerId);
  },
  loadGrades(ownerId?: string): Grade[] {
    try {
      if (ownerId) {
        const cachedOwner = localStorage.getItem(KEYS.gradesOwner);
        if (cachedOwner !== ownerId) return [];
      }
      const raw = localStorage.getItem(KEYS.grades);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  setLastSync() {
    localStorage.setItem(KEYS.lastSync, new Date().toISOString());
  },
  getLastSync(): string | null {
    return localStorage.getItem(KEYS.lastSync);
  },

  saveTeacher(data: Record<string, unknown>) {
    localStorage.setItem(KEYS.teacher, JSON.stringify(data));
    // مسح grades cache لو اتغير الـ user
    const cachedOwner = localStorage.getItem(KEYS.gradesOwner);
    const newId = (data.id as string) ?? null;
    if (newId && cachedOwner && cachedOwner !== newId) {
      localStorage.removeItem(KEYS.grades);
      localStorage.removeItem(KEYS.gradesOwner);
    }
  },
  loadTeacher(): Teacher | null {
    try {
      const raw = localStorage.getItem(KEYS.teacher);
      return raw ? (JSON.parse(raw) as Teacher) : null;
    } catch { return null; }
  },

  saveSysSettings(settings: SystemSettings) {
    localStorage.setItem(KEYS.sysSettings, JSON.stringify(settings));
  },
  loadSysSettings(): SystemSettings | null {
    try {
      const raw = localStorage.getItem(KEYS.sysSettings);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
};

// ── Queue helpers ────────────────────────────────────────────────

export const AttendanceQueue = {
  archive() {
    const queue=AttendanceQueue.getAll();
    for(const teacherId of new Set(queue.map(r=>r.teacher_id))) {
      if(!teacherId) continue;
      const key=`ot_attendance_archive:${teacherId}`;
      const saved:QueuedRecord[]=JSON.parse(localStorage.getItem(key)||"[]");
      const combined=[...saved,...queue.filter(r=>r.teacher_id===teacherId)];
      localStorage.setItem(key,JSON.stringify([...new Map(combined.map(r=>[`${r.teacher_id}|${r.student_id}|${r.group_id||""}|${r.session_date}`,r])).values()]));
    }
  },
  restore(teacherId:string) {
    const key=`ot_attendance_archive:${teacherId}`;
    const archived:QueuedRecord[]=JSON.parse(localStorage.getItem(key)||"[]");
    const own=AttendanceQueue.getAll().filter(r=>r.teacher_id===teacherId);
    localStorage.setItem(KEYS.queue,JSON.stringify([...new Map([...archived,...own].map(r=>[`${r.teacher_id}|${r.student_id}|${r.group_id||""}|${r.session_date}`,r])).values()]));
    localStorage.removeItem(key);AttendanceQueue.notify();
  },
  notify() { if (typeof window !== "undefined") window.dispatchEvent(new Event("attendance-queue-changed")); },
  getAll(): QueuedRecord[] {
    try {
      const raw = localStorage.getItem(KEYS.queue);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  add(record: Omit<AttendanceRecord, "id" | "created_at">) {
    const queue = AttendanceQueue.getAll();
    // avoid duplicates (same student + same session_date)
    const exists = queue.some(
      r => r.teacher_id === record.teacher_id && r.group_id === record.group_id && r.student_id === record.student_id && r.session_date === record.session_date
    );
    if (exists) return;
    queue.push({ ...record, _queuedAt: new Date().toISOString(), _queueId: crypto.randomUUID() });
    localStorage.setItem(KEYS.queue, JSON.stringify(queue));
    AttendanceQueue.notify();
  },

  remove(student_id: string, session_date: string, group_id?: string | null, teacher_id?: string) {
    const queue = AttendanceQueue.getAll().filter(
      r => !(r.student_id === student_id && r.session_date === session_date && (group_id === undefined || r.group_id === group_id) && (!teacher_id || r.teacher_id === teacher_id))
    );
    localStorage.setItem(KEYS.queue, JSON.stringify(queue));
    AttendanceQueue.notify();
  },

  acknowledge(records: QueuedRecord[]) {
    const ids = new Set(records.map(r => r._queueId || `${r.teacher_id}|${r.student_id}|${r.session_date}|${r._queuedAt}`));
    const remaining = AttendanceQueue.getAll().filter(r => !ids.has(r._queueId || `${r.teacher_id}|${r.student_id}|${r.session_date}|${r._queuedAt}`));
    localStorage.setItem(KEYS.queue, JSON.stringify(remaining));
    AttendanceQueue.notify();
  },

  reject(record: QueuedRecord, message: string) {
    const queue = AttendanceQueue.getAll().map(r => r.teacher_id === record.teacher_id && r.group_id === record.group_id && r.student_id === record.student_id && r.session_date === record.session_date ? {...r, _error: message} : r);
    localStorage.setItem(KEYS.queue, JSON.stringify(queue));
    AttendanceQueue.notify();
  },

  clear() {
    localStorage.removeItem(KEYS.queue);
    AttendanceQueue.notify();
  },

  count(): number {
    return AttendanceQueue.getAll().length;
  },
};
