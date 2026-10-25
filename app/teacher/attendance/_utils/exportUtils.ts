import { Student, AttendanceRecord, Group } from "@/lib/types";
import { getGroupSessionDates, isSessionExpired, sessionTime } from "../_utils/sessionDates";
import { AttendanceService } from "@/lib/services/attendanceService";
import { api } from "@/lib/apiClient";
import { studentsForPeriod, contextGroups } from "@/lib/utils/attendancePeriod";
import { printInPlace } from "@/lib/printInPlace";
import { attendanceSlot } from "@/lib/utils/attendanceResolution";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(d: string) {
  return d.slice(5).split("-").reverse().join("/");
}

function buildGroupTable(
  grpStudents: Student[],
  grpDates: string[],
  cancelledSessions: Set<string>,
  attendance: AttendanceRecord[],
  startIndex: number,
  group?: Group,
): string {
  const isPresent = (sid: string, d: string) =>
    attendanceSlot(attendance, sid, d, group?.id)?.status === "present";

  const activeDates = grpDates.filter(d => !cancelledSessions.has(d));

  const dateHeaders = activeDates
    .map(d => `<th>${escapeHtml(formatDate(d))}</th>`)
    .join("");

  const rows = grpStudents.map((s, i) => {
    const joinDate = s.group_join_date || s.created_at?.slice(0, 10) || null;
    const cells = activeDates.map(d => {
      const p = isPresent(s.id, d);
      const resolution = attendanceSlot(attendance, s.id, d, group?.id)?.resolution;
      if (resolution) return `<td class="cell-center resolution">${resolution === "compensated" ? "معوّض" : "معفي"}</td>`;
      const isPastOrExpired = isSessionExpired(d, group ? sessionTime(group, d) : "23:59");
      const beforeJoin = joinDate != null && d < joinDate;
      const excluded = !!s.attendance_excluded_dates?.includes(d) && !attendanceSlot(attendance, s.id, d, group?.id)?.resolution;
      const afterEnd = !!(s.attendance_ends_on && d > s.attendance_ends_on);
      const isExempt = beforeJoin || excluded || afterEnd;

      if (isExempt) {
        return `<td class="cell-center resolution" style="color:#d97706;font-size:9.5px;font-weight:700">معفي</td>`;
      }
      if (!isPastOrExpired) {
        return `<td class="cell-center" style="color:#94a3b8;font-weight:700">—</td>`;
      }
      return `<td class="cell-center" style="color:${p ? "#0d9488" : "#dc2626"};font-weight:700">${p ? "✓" : "✗"}</td>`;
    }).join("");

    const relevantDates = activeDates.filter(d =>
      !s.attendance_excluded_dates?.includes(d) &&
      !attendanceSlot(attendance, s.id, d, group?.id)?.resolution &&
      (!joinDate || d >= joinDate) &&
      (!s.attendance_ends_on || d <= s.attendance_ends_on) &&
      isSessionExpired(d, group ? sessionTime(group, d) : "23:59")
    );
    const presentCount = relevantDates.filter(d => isPresent(s.id, d)).length;
    const hasPastSessions = relevantDates.length > 0;
    const pct = hasPastSessions ? Math.round((presentCount / relevantDates.length) * 100) : null;
    const pctColor = pct !== null ? (pct >= 75 ? "#0d9488" : pct >= 50 ? "#d97706" : "#dc2626") : "#94a3b8";

    return `<tr>
      <td class="cell-center">${startIndex + i + 1}</td>
      <td class="cell-code">${escapeHtml(s.code || "—")}</td>
      <td class="cell-name">${escapeHtml(s.name)}</td>
      ${cells}
      <td class="cell-center" style="font-weight:700;color:${pctColor}">${pct !== null ? `${pct}%` : "—"}</td>
    </tr>`;
  }).join("");

  return `<table>
    <thead><tr>
      <th class="col-num">#</th>
      <th class="col-code">الكود</th>
      <th class="col-name">الطالب</th>
      ${dateHeaders}
      <th class="col-pct">النسبة</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export async function exportAttendancePrint(
  students: Student[],
  _sessionDates: string[],
  _attendance: AttendanceRecord[],
  month: number,
  year: number,
  groupName: string,
  groups?: Group[],
  cancelledSessions: Set<string> = new Set(),
  confirmedRecords?: AttendanceRecord[],
) {
  if (!navigator.onLine) throw new Error("عرض التقرير يحتاج اتصالًا لتأكيد بيانات الحضور");
  let attendance: AttendanceRecord[];
  try {
    attendance = (confirmedRecords || await AttendanceService.getAttendanceRecords(month, year)).filter(r => !r.id.startsWith("offline-") && !r.id.startsWith("optimistic-"));
  } catch {
    throw new Error("تعذر تحديث بيانات التقرير؛ حاول مرة أخرى");
  }

  let body = "";

  if (groups && groups.length > 0) {
    const map = new Map<string, Student[]>();
    for (const s of students) {
      const key = s.group_id || "no-group";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }

    let idx = 0;
    map.forEach((grpStudents, groupId) => {
      const grp = groups.find(g => g.id === groupId);
      const grpName = escapeHtml(grp ? grp.name : "بدون مجموعة");
      const days = grp
        ? grp.day_of_week.split(/\s*[,،]\s*|\s+/).map(d => d.trim()).filter(Boolean)
        : [];
      const grpDates = grp ? getGroupSessionDates(grp, month, year) : [];
      const groupRecords = attendance.filter(r => (!groupId || r.group_id === groupId || r.scanner_group_id === groupId));
      const recordDates = groupRecords.map(r => r.session_date).filter(d => d.startsWith(`${year}-${String(month).padStart(2, "0")}-`));
      const allGrpDates = [...new Set([...grpDates, ...recordDates])].sort();
      const groupCancelled = new Set(grp?.cancelled_sessions ?? []);
      const activeDates = allGrpDates.filter(d => !groupCancelled.has(d));
      const daysHtml = days.map(d => `<span class="day-chip">${escapeHtml(d)}</span>`).join("");

      body += `<div class="group-block">
        <div class="group-header">
          <span>${grpName}</span>
          <span class="group-meta">
            ${daysHtml}
            <span class="group-count">${grpStudents.length} طالب · ${activeDates.length} حصة</span>
          </span>
        </div>
        ${buildGroupTable(grpStudents, allGrpDates, groupCancelled, attendance, idx, grp)}
      </div>`;
      idx += grpStudents.length;
    });
  } else {
    const grp = groups?.find(g => g.name === groupName) ?? null;
    const days = grp
      ? grp.day_of_week.split(/\s*[,،]\s*|\s+/).map(d => d.trim()).filter(Boolean)
      : [];
    const grpDates = grp ? getGroupSessionDates(grp, month, year) : _sessionDates;
    const groupRecords = attendance.filter(r => (!grp?.id || r.group_id === grp.id || r.scanner_group_id === grp.id));
    const recordDates = groupRecords.map(r => r.session_date).filter(d => d.startsWith(`${year}-${String(month).padStart(2, "0")}-`));
    const allGrpDates = [...new Set([...grpDates, ...recordDates])].sort();
    const daysText = days.length > 0 ? ` · ${days.join(" - ")}` : "";
    body = `<p class="subtitle" style="margin-bottom:8px">${students.length} طالب · ${allGrpDates.filter(d => !cancelledSessions.has(d)).length} حصة فعّالة${daysText}</p>`
      + buildGroupTable(students, allGrpDates, cancelledSessions, attendance, 0, grp || undefined);
  }

  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>كشف حضور</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; padding: 12px; font-size: 11px; color: #111; direction: rtl; }
      h2 { text-align: center; margin-bottom: 4px; font-size: 15px; font-weight: 700; }
      .subtitle { text-align: center; color: #666; font-size: 11px; margin-bottom: 12px; }
      table { border-collapse: collapse; width: 100%; table-layout: fixed; margin-bottom: 16px; }
      th { background: #e5f7f5; padding: 5px 3px; border: 1px solid #b2d8d8; font-size: 10.5px; text-align: center; white-space: nowrap; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      td { border: 1px solid #ccc; padding: 4px 3px; font-size: 10.5px; vertical-align: middle; }
      .col-num { width: 32px; }
      .col-code { width: 75px; }
      .col-name { width: 160px; }
      .col-pct { width: 50px; }
      .col-date { min-width: 40px; }
      .cell-center { text-align: center; }
      .cell-code { text-align: center; font-family: monospace; font-size: 10.5px; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .cell-name { font-weight: 600; font-size: 11px; white-space: normal; word-break: break-word; }
      .resolution { font-size: 9.5px; font-weight: 700; color: #d97706; }
      .group-block { margin-bottom: 20px; }
      .group-header { background: #0d9488; color: #fff; padding: 6px 10px; font-weight: 700; font-size: 12px; border-radius: 5px 5px 0 0; display: flex; align-items: center; justify-content: space-between; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .group-meta { display: flex; align-items: center; gap: 6px; font-weight: 400; font-size: 11px; }
      .group-count { opacity: 0.9; white-space: nowrap; }
      .day-chip { background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.4); border-radius: 3px; padding: 1px 6px; font-size: 10px; font-weight: 600; white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

      thead { display: table-header-group; }
      tr { break-inside: avoid; page-break-inside: avoid; }
      @media print {
        body { padding: 0; margin: 0; }
        .group-block { page-break-inside: auto; break-inside: auto; }
      }
      @page { margin: 8mm; size: A4 landscape; }
    </style>
    </head><body>
    <h2>كشف الحضور — ${escapeHtml(groupName)} — ${arabicMonths[month - 1]} ${year}</h2>
    <p class="subtitle">${new Date().toLocaleDateString("ar-EG")}</p>
    ${body}
    </body></html>`;

  await printInPlace({ html });
}

/** Report selection is separate from the live current-month table. */
export async function exportAttendanceMonth(month: number, year: number, selection: { gradeId: string; groupId: string }) {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("اختر شهرًا وسنة صحيحين");
  if (!navigator.onLine) throw new Error("عرض التقرير يحتاج اتصالًا لتأكيد بيانات الحضور");
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;
  const [records, context, students] = await Promise.all([
    AttendanceService.getAttendanceRecords(month, year),
    AttendanceService.getContext(),
    api.get<Student[]>("/students?fields=id,name,code,group_id,grade_id,created_at,group_join_date"),
  ]);
  const groups = contextGroups([], context), byGroup = new Map(groups.map(g => [g.id, g]));
  const targetGroups = selection.groupId !== "all" ? groups.filter(g => g.id === selection.groupId) : groups;
  const roster = studentsForPeriod(students, context.memberships, start, end, records).filter(s => {
    const hasRecord = records.some(r => r.student_id === s.id);
    const joinDateValid = !s.group_join_date || s.group_join_date <= end || hasRecord;
    const groupMatch = selection.groupId === "all" || s.group_id === selection.groupId;
    const gradeMatch = selection.gradeId === "all" || (s.grade_id || byGroup.get(s.group_id || "")?.grade_id) === selection.gradeId;
    return joinDateValid && groupMatch && gradeMatch;
  });
  if (!roster.length) throw new Error("لا يوجد طلاب في الشهر والاختيار المحددين");
  await exportAttendancePrint(roster, [], [], month, year, byGroup.get(selection.groupId)?.name || "الكل", targetGroups, new Set(), records);
}
