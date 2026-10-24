import type { AttendanceRecord, Group, Student } from "@/lib/types";
import { actualAttendanceSlot, attendanceForDates, attendanceSlot, isGuestAttendance, isPendingAttendance } from "@/lib/utils/attendanceResolution";
import { getGroupSessionDates, isSessionExpired, sessionTime } from "./sessionDates";

export function monthBounds(month: number, year: number) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return { start: `${prefix}-01`, end: `${prefix}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}` };
}
export function weekBounds(today: string, offset: number) {
  const start = new Date(today + "T12:00:00Z");
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 1) % 7) + offset * 7);
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
export function scheduledDates(group: Group, start: string, end: string) {
  const first = start.slice(0, 7), last = end.slice(0, 7);
  const dates = new Set<string>();
  for (const key of new Set([first, last])) {
    const [year, month] = key.split("-").map(Number);
    getGroupSessionDates(group, month, year).forEach(date => { if (date >= start && date <= end) dates.add(date); });
  }
  return [...dates].sort();
}
export function withAttendanceGuests(roster: Student[], students: Student[], groups: Group[], records: AttendanceRecord[], start: string, end: string) {
  const rows = roster.map(s => ({ ...s }));
  const identities = new Map(rows.map(s => [`${s.id}|${s.group_id}`, s]));
  const source = new Map(students.map(s => [s.id, s]));
  const grades = new Map(groups.map(g => [g.id, g.grade_id]));
  for (const record of records) {
    if (!isGuestAttendance(record) || record.status !== "present" || !record.group_id || record.session_date < start || record.session_date > end) continue;
    const original = source.get(record.student_id);
    if (!original) continue;
    const key = `${record.student_id}|${record.group_id}`;
    let row = identities.get(key);
    if (!row) {
      row = { ...original, group_id: record.group_id, grade_id: grades.get(record.group_id), attendance_guest_only: true, attendance_guest_dates: [], attendance_resolutions: {}, attendance_excluded_dates: [] };
      identities.set(key, row); rows.push(row);
    }
    row.attendance_guest_dates = [...new Set([...(row.attendance_guest_dates || []), record.session_date])];
  }
  return rows;
}
export function requiredDates(student: Student, dates: string[]) {
  if (student.attendance_guest_only) return [];
  const joined = student.group_join_date || student.created_at?.slice(0, 10) || "";
  return dates.filter(d => d >= joined && (!student.attendance_ends_on || d <= student.attendance_ends_on) && !student.attendance_excluded_dates?.includes(d));
}
export function elapsedDates(group: Group, dates: string[], now?: number) {
  return dates.filter(d => !group.cancelled_sessions?.includes(d) && isSessionExpired(d, sessionTime(group, d), now === undefined ? undefined : new Date(now)));
}
export function studentPercent(student: Student, dates: string[], records: AttendanceRecord[]) {
  const value = attendanceForDates(records, student.id, requiredDates(student, dates), student.group_id);
  return value.total ? value.percent : null;
}
export type AttendanceStatus = "all" | "present" | "absent" | "compensated" | "exempt" | "pending" | "guest";
export function studentStatus(student: Student, date: string, records: AttendanceRecord[], elapsed: boolean) {
  if (student.attendance_guest_dates?.includes(date)) return "guest";
  if (!requiredDates(student, [date]).length) return "none";
  const row = attendanceSlot(records, student.id, date, student.group_id);
  if (row?.resolution) return row.resolution;
  if (row && isPendingAttendance(row)) return "pending";
  if (row?.status === "present") return "present";
  return elapsed ? "absent" : "none";
}
export function displayRecord(student: Student, date: string, records: AttendanceRecord[]) {
  return student.attendance_guest_dates?.includes(date) ? actualAttendanceSlot(records, student.id, date, student.group_id) : attendanceSlot(records, student.id, date, student.group_id);
}

/** Keep today's lesson beside the pinned identity column in an RTL scroll area. */
export function focusAttendanceDate(container: HTMLElement | null, date: string | undefined) {
  const header = container?.querySelector<HTMLElement>(`[data-date="${date}"]`);
  const identity = container?.querySelector<HTMLElement>("thead th:first-child");
  if (!container || !header || !identity || container.scrollWidth <= container.clientWidth) return;
  const right = container.getBoundingClientRect().right - identity.offsetWidth;
  container.scrollLeft += header.getBoundingClientRect().right - right;
}
