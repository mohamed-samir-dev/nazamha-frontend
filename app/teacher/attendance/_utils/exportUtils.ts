import type { Student, AttendanceRecord, Group } from "@/lib/types";
import { AttendanceService } from "@/lib/services/attendanceService";
import { StudentsService } from "@/lib/services/studentsService";
import { printInPlace } from "@/lib/printInPlace";
import { isPendingAttendance, attendanceForDates, attendanceSlot, actualAttendanceSlot } from "@/lib/utils/attendanceResolution";
import { studentsForPeriod, contextGroups } from "@/lib/utils/attendancePeriod";
import { monthBounds, withAttendanceGuests, requiredDates, elapsedDates } from "./attendanceView";
import { getGroupSessionDates } from "./sessionDates";
const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const dateLabel = (date: string) => date.slice(5).split("-").reverse().join("/");

export function buildAttendanceReport(students: Student[], records: AttendanceRecord[], month: number, year: number, title: string, groups: Group[], fallbackDates: string[] = [], cancelled: Set<string> = new Set()) {
  const groupMap = new Map(groups.map(g => [g.id, g]));
  const blocks = new Map<string, Student[]>();
  for (const student of students) { const key = student.group_id || "no-group"; const rows = blocks.get(key) || []; rows.push(student); blocks.set(key, rows); }
  let body = "", blockIndex = 0, index = 0;
  for (const [id, rows] of blocks) {
    const group = groupMap.get(id);
    const excluded = group ? new Set(group.cancelled_sessions || []) : cancelled;
    const dates = (group ? getGroupSessionDates(group, month, year) : fallbackDates).filter(date => !excluded.has(date));
    const eligible = group ? elapsedDates(group, dates) : [];
    const chunks = Array.from({ length: Math.max(1, Math.ceil(dates.length / 7)) }, (_, i) => dates.slice(i * 7, i * 7 + 7));
    for (const [part, columns] of chunks.entries()) {
      const heading = `${group?.name || "بدون مجموعة"}${chunks.length > 1 ? ` — ${part + 1}/${chunks.length}` : ""}`;
      body += `<section class="report-section${blockIndex++ ? " new-section" : ""}"><table><colgroup><col style="width:4%"><col style="width:12%"><col style="width:28%">${columns.map(() => `<col style="width:${48 / Math.max(1, columns.length)}%">`).join("")}<col style="width:8%"></colgroup><thead><tr><th class="group-title" colspan="${columns.length + 4}">${escapeHtml(heading)} · ${months[month - 1]} ${year}</th></tr><tr><th>#</th><th>الكود</th><th>الطالب</th>${columns.map(d => `<th>${dateLabel(d)}</th>`).join("")}<th>الشهر %</th></tr></thead><tbody>`;
      body += rows.map((student, i) => {
        const summary = attendanceForDates(records, student.id, requiredDates(student, eligible), student.group_id);
        const cells = columns.map(date => {
          if (student.attendance_guest_dates?.includes(date)) {
            const actual = actualAttendanceSlot(records, student.id, date, student.group_id);
            return `<td>${actual?.status === "present" ? "✓ ضيف" : "—"}</td>`;
          }
          if (!requiredDates(student, [date]).length) return "<td>—</td>";
          const row = attendanceSlot(records, student.id, date, student.group_id);
          if (row?.resolution) return `<td>${row.resolution === "compensated" ? "معوّض" : "معفى"}</td>`;
          return `<td>${row?.status === "present" ? "✓" : eligible.includes(date) ? "✗" : "—"}</td>`;
        }).join("");
        return `<tr><td>${index + i + 1}</td><td class="code">${escapeHtml(student.code || "—")}</td><td class="name">${escapeHtml(student.name)}${student.attendance_guest_only ? " <small>ضيف</small>" : ""}</td>${cells}<td>${summary.total ? summary.percent + "%" : "—"}</td></tr>`;
      }).join("");
      body += "</tbody></table></section>";
    }
    index += rows.length;
  }
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>كشف الحضور — ${escapeHtml(title)}</title><style>
*{box-sizing:border-box}html{direction:rtl;background:white;color:#18212b}body{margin:0;padding:12mm;font:11px Arial,sans-serif}h1{text-align:center;font-size:16px;margin:0 0 5px}.subtitle{text-align:center;font-size:11px;color:#495461;margin:0 0 12px}table{border-collapse:collapse;table-layout:fixed;width:100%}thead{display:table-header-group}th,td{border:1px solid #a6b3bd;padding:6px 3px;text-align:center;vertical-align:middle;line-height:1.6;overflow-wrap:anywhere}th{font-weight:700;background:#ecf1f3}.group-title{text-align:right;background:#e0eae7;padding:8px;font-size:12px}.name{text-align:right;white-space:normal;font-weight:600}.code{font-size:10px;direction:ltr;unicode-bidi:isolate;white-space:normal}.name small{font-size:9px;color:#505e6b}tr{break-inside:avoid;page-break-inside:avoid}.report-section{margin:0}.new-section{break-before:page;page-break-before:always}@page{size:A4 portrait;margin:14mm 12mm 16mm}@media print{body{padding:0}html{background:white}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><h1>كشف الحضور — ${escapeHtml(title)}</h1><p class="subtitle">${months[month - 1]} ${year} · ${new Date().toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}</p>${body || "<p>لا توجد بيانات في الشهر المختار</p>"}</body></html>`;
}

export async function exportAttendancePrint(students: Student[], sessionDates: string[], _attendance: AttendanceRecord[], month: number, year: number, groupName: string, groups: Group[] = [], cancelledSessions: Set<string> = new Set(), selection?: { gradeId: string; groupId: string }) {
  if (!navigator.onLine) throw new Error("الطباعة تحتاج اتصالًا لتأكيد الحضور");
  let records: AttendanceRecord[], roster = students, reportGroups = groups;
  try {
    const bounds = monthBounds(month, year);
    const [fresh, snapshot] = await Promise.all([
      AttendanceService.getAttendanceRecords(month, year),
      selection ? Promise.all([
        AttendanceService.getContext(bounds),
        StudentsService.getStudentsByTeacherId("id,name,code,group_id,grade_id,created_at,group_join_date", { fresh: true }),
      ]) : Promise.resolve(null),
    ]);
    records = fresh.filter(row => !isPendingAttendance(row));
    if (snapshot) {
      const [context, currentStudents] = snapshot;
      reportGroups = contextGroups([], context);
      roster = withAttendanceGuests(studentsForPeriod(currentStudents, context.memberships, bounds.start, bounds.end, records), currentStudents, reportGroups, records, bounds.start, bounds.end);
      const map = new Map(reportGroups.map(g => [g.id, g]));
      roster = roster.filter(s => (selection!.groupId === "all" || s.group_id === selection!.groupId) && (selection!.gradeId === "all" || (s.grade_id || map.get(s.group_id || "")?.grade_id) === selection!.gradeId));
    }
  } catch { throw new Error("تعذر تحديث بيانات التقرير؛ حاول مرة أخرى"); }
  await printInPlace({ html: buildAttendanceReport(roster, records, month, year, groupName, reportGroups, sessionDates, cancelledSessions) });
}
