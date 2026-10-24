import type { AttendanceRecord } from "@/lib/types";

export const attendanceKey = (studentId: string, groupId: string | null | undefined, date: string) => `${studentId}|${groupId || ""}|${date}`;
export const isGuestAttendance = (row: AttendanceRecord) => row.attendance_kind === "guest" || row.attendance_kind === "substitute";
export const isPendingAttendance = (row: AttendanceRecord) => /^(offline|optimistic)-/.test(row.id);
const indexes = new WeakMap<AttendanceRecord[], { regular: Map<string, AttendanceRecord>; actual: Map<string, AttendanceRecord>; first: Map<string, AttendanceRecord> }>();
function index(records: AttendanceRecord[]) {
  let result = indexes.get(records);
  if (result) return result;
  result = { regular: new Map(), actual: new Map(), first: new Map() };
  for (const row of records) {
    const key = attendanceKey(row.student_id, row.group_id, row.session_date);
    if (!result.actual.has(key)) result.actual.set(key, row);
    if (!isGuestAttendance(row)) {
      if (!result.regular.has(key)) result.regular.set(key, row);
      const firstKey = `${row.student_id}|${row.session_date}`;
      if (!result.first.has(firstKey)) result.first.set(firstKey, row);
    }
  }
  indexes.set(records, result);
  return result;
}
export function attendanceSlot(records: AttendanceRecord[], studentId: string, date: string, groupId?: string | null) {
  const rows = index(records);
  return groupId ? rows.regular.get(attendanceKey(studentId, groupId, date)) || rows.regular.get(attendanceKey(studentId, null, date)) : rows.first.get(`${studentId}|${date}`);
}
export function actualAttendanceSlot(records: AttendanceRecord[], studentId: string, date: string, groupId?: string | null) {
  return index(records).actual.get(attendanceKey(studentId, groupId, date));
}
export function mergeAttendance(records: AttendanceRecord[], additions: AttendanceRecord[]) {
  const rows = new Map(records.map(row => [attendanceKey(row.student_id, row.group_id, row.session_date), row]));
  for (const row of additions) rows.set(attendanceKey(row.student_id, row.group_id, row.session_date), row);
  return [...rows.values()];
}
export function attendanceForDates(records: AttendanceRecord[], studentId: string, dates: string[], groupId?: string | null) {
  let present = 0, total = 0, compensated = 0, exempt = 0;
  for (const date of dates) {
    const row = attendanceSlot(records, studentId, date, groupId);
    if (row?.resolution === "compensated") compensated++;
    else if (row?.resolution === "exempt") exempt++;
    else if (!row || !isPendingAttendance(row)) { total++; if (row?.status === "present") present++; }
  }
  return { present, total, absent: total - present, percent: total ? Math.round(present / total * 100) : 0, compensated, exempt };
}
