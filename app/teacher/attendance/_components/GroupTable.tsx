"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, QrCode } from "lucide-react";
import type { Student, Group, AttendanceRecord } from "@/lib/types";
import { getTodayCairo } from "@/lib/utils/dateUtils";
import { isSessionExpired, sessionTime } from "../_utils/sessionDates";
import { requiredDates, studentPercent, focusAttendanceDate } from "../_utils/attendanceView";
import { SessionHeaderCell, type SessionState } from "./SessionHeaderCell";
import { AttendanceCell } from "./AttendanceCell";
import styles from "../attendance.module.css";

interface Props {
  group: Group | null; groupId: string; students: Student[]; totalStudents: number;
  sessionDates: string[]; attendance: AttendanceRecord[]; startIndex: number;
  isPastWeek: boolean; periodLabel: string; now: number; readOnly?: boolean;
  isSaving: (gid: string, date: string) => boolean;
  isCellSaving?: (sid: string, date: string, gid?: string | null) => boolean;
  onToggle: (student: Student, date: string) => void;
  onMarkAll: (date: string, gid: string) => void; onClearSession: (date: string, gid: string) => void;
  onCancelSession: (gid: string, date: string, cancelled?: boolean) => void;
  onRevokeResolution?: (student: Student, date: string) => void;
  onShowQR: (student: Student) => void; onShowToast: (msg: string, type: "error") => void;
}
export function GroupTable(p: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const today = getTodayCairo();
  const states = useMemo(() => Object.fromEntries(p.sessionDates.map(date => [date, p.group?.cancelled_sessions?.includes(date) ? "cancelled" : date > today ? "future" : isSessionExpired(date, p.group ? sessionTime(p.group, date) : "23:59", new Date(p.now)) ? "expired" : "active"])) as Record<string, SessionState>, [p.sessionDates, p.group, today, p.now]);
  const activeDates = useMemo(() => p.sessionDates.filter(d => states[d] === "expired"), [p.sessionDates, states]);
  const id = `attendance-group-${p.groupId}`;
  useEffect(() => {
    const date = p.sessionDates.filter(d => d <= today).at(-1) || p.sessionDates[0];
    focusAttendanceDate(scroll.current, date);
  }, [p.sessionDates, today, collapsed]);
  return <section className={styles.group}>
    <button type="button" className={styles.groupHeading} aria-expanded={!collapsed} aria-controls={id} onClick={() => setCollapsed(v => !v)}>
      <span><strong>{p.group?.name || "بدون مجموعة"}</strong><small>{p.students.length < p.totalStudents ? `عرض ${p.students.length} من ${p.totalStudents}` : `${p.totalStudents} طالب`}</small></span>
      <ChevronDown size={18} style={{ transform: collapsed ? undefined : "rotate(180deg)" }} />
    </button>
    {!collapsed && <div ref={scroll} id={id} className={styles.tableScroll} tabIndex={0} role="region" aria-label={`جدول ${p.group?.name || "الطلاب"}`}>
      <table className={styles.table}>
        <thead><tr>
          <th className={styles.studentColumn} scope="col">الطالب</th>
          {p.sessionDates.map(date => <SessionHeaderCell key={date} dateStr={date} state={states[date]} saving={p.isSaving(p.groupId, date)} readOnly={p.readOnly} groupId={p.group?.id || null} isPastWeek={p.isPastWeek} onMarkAll={p.onMarkAll} onClearSession={p.onClearSession} onCancelSession={p.onCancelSession} />)}
          <th scope="col">نسبة {p.periodLabel}</th>
          <th scope="col">QR</th>
        </tr></thead>
        <tbody>{p.students.map((student, index) => {
          const pct = studentPercent(student, activeDates, p.attendance);
          return <tr key={`${student.id}-${student.group_id}-${student.group_join_date}-${student.attendance_guest_only || false}`}>
            <th scope="row" className={styles.studentColumn}><div className={styles.studentName}>{student.name}</div><div className={styles.studentMeta}><span>{p.startIndex + index + 1}</span><span>{student.code || "—"}</span>{student.attendance_guest_only && <span className={styles.guestTag}>ضيف</span>}</div></th>
            {p.sessionDates.map(date => {
              const guest = student.attendance_guest_dates?.includes(date);
              if (!guest && !requiredDates(student, [date]).length) return <td key={date} className={styles.neutral}>—</td>;
              return <AttendanceCell key={date} student={student} dateStr={date} state={states[date]} records={p.attendance} onToggle={p.onToggle} onRevokeResolution={p.onRevokeResolution} isPastWeek={p.isPastWeek} readOnly={p.readOnly || !p.group} saving={p.isCellSaving?.(student.id, date, student.group_id)} sessionSaving={p.isSaving(p.groupId, date)} onShowToast={p.onShowToast} />;
            })}
            <td className={styles.percentage} data-level={pct === null ? "none" : pct >= 75 ? "good" : pct >= 50 ? "medium" : "low"}>{pct === null ? "—" : `${pct}%`}</td>
            <td><button type="button" className={styles.qrButton} aria-label={`عرض QR ${student.name}`} onClick={() => p.onShowQR(student)}><QrCode size={18} /></button></td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
  </section>;
}
