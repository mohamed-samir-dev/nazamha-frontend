"use client";
import { Check, LoaderCircle, X } from "lucide-react";
import type { AttendanceRecord, Student } from "@/lib/types";
import { isPendingAttendance } from "@/lib/utils/attendanceResolution";
import { displayRecord } from "../_utils/attendanceView";
import type { SessionState } from "./SessionHeaderCell";
import styles from "../attendance.module.css";
interface Props {
  present?: boolean; state: SessionState; student: Student; dateStr: string;
  records?: AttendanceRecord[]; onToggle: (student: Student, date: string) => void;
  onRevokeResolution?: (student: Student, date: string) => void;
  isPastWeek: boolean; readOnly?: boolean; saving?: boolean; sessionSaving?: boolean;
  onShowToast?: (msg: string, type: "error") => void;
}
export function AttendanceCell(p: Props) {
  const record = p.records ? displayRecord(p.student, p.dateStr, p.records) : undefined;
  const guest = p.student.attendance_guest_dates?.includes(p.dateStr);
  const present = record ? record.status === "present" : !!p.present;
  const resolution = record?.resolution || p.student.attendance_resolutions?.[p.dateStr];
  const suspended = p.student.is_suspended && (!p.student.suspended_until || new Date(p.student.suspended_until) > new Date());
  const pending = record && isPendingAttendance(record);
  if (p.saving) return <td><span className={styles.savingCell} role="status" aria-live="polite"><LoaderCircle size={15} className={styles.spin} /><span>جاري الحفظ</span></span></td>;
  if (p.state === "cancelled") return <td className={styles.neutral}>—</td>;
  if (resolution) return <td><button type="button" className={styles.resolution} disabled={p.readOnly || p.sessionSaving || !record?.substitution_id || !p.onRevokeResolution} aria-label={`تصحيح ${resolution === "exempt" ? "إعفاء" : "تعويض"} ${p.student.name} في ${p.dateStr}`} onClick={() => p.onRevokeResolution?.(p.student, p.dateStr)}>{resolution === "exempt" ? "معفى" : "معوّض"}</button></td>;
  const locked = p.readOnly || p.sessionSaving || p.isPastWeek || p.state === "future" || (!!suspended && !present);
  return <td><button type="button" className={styles.attendanceButton} data-status={pending ? "pending" : guest ? "guest" : present ? "present" : p.state === "expired" ? "absent" : "empty"} disabled={locked}
    aria-label={`${present ? "إلغاء حضور" : "تسجيل حضور"} ${p.student.name} في ${p.dateStr}${pending ? " — بانتظار المزامنة" : ""}`} aria-pressed={present} title={pending ? "بانتظار المزامنة" : guest ? "حضور كضيف" : undefined} onClick={() => p.onToggle(p.student, p.dateStr)}>
    {pending ? <span className={styles.pendingLabel}>معلّق</span> : present ? <Check size={18} /> : p.state === "expired" ? <X size={15} /> : null}
  </button>{guest && <small className={styles.cellGuest}>ضيف</small>}</td>;
}
