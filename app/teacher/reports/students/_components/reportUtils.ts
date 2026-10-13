import { Student } from "@/lib/types";
import { arabicMonths, AlertItem, Subscription } from "./types";

export function getLastPaidMonth(
  studentId: string,
  allSubs: Subscription[],
  selectedMonthIndex: number,
  selectedYear: number
): string {
  const paid = allSubs
    .filter((s) => s.student_id === studentId && (s.status === "paid" || s.status === "exempt"))
    .filter((s) => s.year < selectedYear || (s.year === selectedYear && s.month <= selectedMonthIndex + 1))
    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
  if (paid.length === 0) return "—";
  const last = paid[0];
  return `${arabicMonths[last.month - 1]} ${last.year}`;
}

export function getArrears(
  studentId: string,
  allSubs: Subscription[],
  selectedMonthIndex: number,
  selectedYear: number
): number {
  return allSubs.filter((s) => {
    if (s.student_id !== studentId || s.status !== "due") return false;
    return s.year < selectedYear || (s.year === selectedYear && s.month <= selectedMonthIndex + 1);
  }).length;
}

export function getConsecutiveAbsences(
  studentId: string,
  last10Sessions: Set<string>,
  getAttendance: (id: string) => { present: number; absent: number; total: number }
): boolean {
  if (last10Sessions.size < 3) return false;
  return getAttendance(studentId).absent >= 3;
}

export function hasAllSubsPaid(
  studentId: string,
  allSubs: Subscription[]
): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const due = allSubs.filter((s) =>
    s.student_id === studentId &&
    s.status === "due" &&
    (s.year < currentYear || (s.year === currentYear && s.month <= currentMonth))
  );
  return due.length < 2;
}

export function getExamAvgPct(
  exams: { score: number | null; max_score: number }[]
): number | null {
  const scored = exams.filter((e) => e.score !== null && e.max_score > 0);
  if (scored.length === 0) return null;
  const avg = scored.reduce((sum, e) => sum + (e.score! / e.max_score) * 100, 0) / scored.length;
  return Math.round(avg);
}

export function isTopStudent(
  attendancePct: number,
  totalSessions: number,
  allSubsPaid: boolean,
  examAvgPct: number | null
): boolean {
  return (
    totalSessions > 0 &&
    attendancePct >= 80 &&
    allSubsPaid &&
    examAvgPct !== null &&
    examAvgPct >= 85
  );
}

export function getAlerts(
  student: Student,
  att: { present: number; absent: number; total: number },
  pct: number,
  arrears: number,
  consecutiveAbsences: boolean,
  paid: boolean,
  allSubsPaid?: boolean,
  examAvgPct?: number | null
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const total = att.total;
  if (isTopStudent(pct, total, allSubsPaid ?? paid, examAvgPct ?? null))
    alerts.push({ type: "star", title: "طالب متميز — حضور 80%+ ومتوسط درجات 85%+ وجميع الاشتراكات مسددة" });
  if (pct < 50 && total > 0) alerts.push({ type: "expulsion", title: "معرض للفصل (حضور أقل من 50%)" });
  if (consecutiveAbsences) alerts.push({ type: "absence", title: "غاب 3 أيام أو أكثر" });
  if (arrears >= 2) alerts.push({ type: "arrears", title: `متأخر ${arrears} شهور في الدفع` });
  return alerts;
}
