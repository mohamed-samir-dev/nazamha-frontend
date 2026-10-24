"use client";
import { useMemo, useState } from "react";
import type { Student, AttendanceRecord, Group } from "@/lib/types";
import { attendanceForDates } from "@/lib/utils/attendanceResolution";
import { elapsedDates, requiredDates } from "../_utils/attendanceView";
import { getGroupSessionDates } from "../_utils/sessionDates";
import styles from "../attendance.module.css";
interface Props { groups?: Group[]; students: Student[]; monthDates: string[]; cancelledSessions: Set<string>; attendance: AttendanceRecord[]; selectedMonth: number; selectedYear: number; now?: number; }
export function AttendanceStats({ groups = [], students, attendance, selectedMonth, selectedYear, now: clock }: Props) {
  const [initialNow] = useState(() => Date.now());
  const now = clock ?? initialNow;
  const stats = useMemo(() => {
    const map = new Map(groups.map(g => [g.id, g]));
    const schedules = new Map(groups.map(g => { const dates = getGroupSessionDates(g, selectedMonth, selectedYear); return [g.id, { all: dates.filter(d => !g.cancelled_sessions?.includes(d)), elapsed: elapsedDates(g, dates, now) }]; }));
    const totals = new Map<string, { present: number; total: number }>();
    const roster = students.filter(s => !s.attendance_guest_only);
    for (const student of roster) {
      if (!map.has(student.group_id || "")) continue;
      const result = attendanceForDates(attendance, student.id, requiredDates(student, schedules.get(student.group_id!)?.elapsed || []), student.group_id);
      const current = totals.get(student.id) || { present: 0, total: 0 };
      totals.set(student.id, { present: current.present + result.present, total: current.total + result.total });
    }
    const percentages = [...totals.values()].filter(s => s.total).map(s => Math.round(s.present / s.total * 100));
    const ids = new Set(roster.map(s => s.group_id));
    return { students: new Set(roster.map(s => s.id)).size, sessions: [...schedules].filter(([id]) => ids.has(id)).reduce((sum, [, schedule]) => sum + schedule.all.length, 0), avg: percentages.length ? Math.round(percentages.reduce((sum, n) => sum + n, 0) / percentages.length) : null, below: percentages.filter(n => n < 75).length };
  }, [groups, students, attendance, selectedMonth, selectedYear, now]);
  return <dl className={styles.summary} aria-label="ملخص الشهر المختار">
    <div><dd>{stats.students}</dd><dt>الطلاب</dt></div>
    <div><dd>{stats.sessions}</dd><dt>حصص الشهر</dt></div>
    <div><dd data-level={stats.avg === null ? "none" : stats.avg >= 75 ? "good" : "low"}>{stats.avg === null ? "—" : `${stats.avg}%`}</dd><dt>متوسط الحضور</dt></div>
    <div><dd>{stats.below}</dd><dt>أقل من 75%</dt></div>
  </dl>;
}
