import { Student, AttendanceRecord, Group } from "@/lib/types";
import { getGroupSessionDates, isSessionExpired, sessionTime } from "../_utils/sessionDates";
import { AttendanceService } from "@/lib/services/attendanceService";
import { AttendanceQueue } from "@/lib/offlineQueue";
import { printInPlace } from "@/lib/printInPlace";
import {attendanceSlot} from "@/lib/utils/attendanceResolution";

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
    attendanceSlot(attendance,sid,d,group?.id)?.status === "present";

  const activeDates = grpDates.filter(d => !cancelledSessions.has(d));

  const dateHeaders = activeDates
    .map(d => `<th>${escapeHtml(formatDate(d))}</th>`)
    .join("");


  const rows = grpStudents.map((s, i) => {
    const joinDate = s.group_join_date || s.created_at?.slice(0, 10) || null;
    const cells = activeDates.map(d => {
      const p = isPresent(s.id, d);
      const resolution=attendanceSlot(attendance,s.id,d,group?.id)?.resolution;
      if(resolution)return `<td class="cell-center">${resolution==="compensated"?"معوّض":"معفى"}</td>`;
      const neutral = !!s.attendance_excluded_dates?.includes(d)&&!attendanceSlot(attendance,s.id,d,group?.id)?.resolution || !!(s.attendance_ends_on && d > s.attendance_ends_on) || !isSessionExpired(d, group ? sessionTime(group,d) : "23:59") || (joinDate != null && d < joinDate);
      return `<td class="cell-center" style="color:${p ? "#0d9488" : neutral ? "#aaa" : "#dc2626"};font-weight:700">${p ? "✓" : neutral ? "—" : "✗"}</td>`;
    }).join("");
    const relevantDates = activeDates.filter(d => !s.attendance_excluded_dates?.includes(d)&&!attendanceSlot(attendance,s.id,d,group?.id)?.resolution && (!joinDate || d >= joinDate) && (!s.attendance_ends_on || d<=s.attendance_ends_on) && isSessionExpired(d, group ? sessionTime(group,d) : "23:59"));
    const present = relevantDates.filter(d => isPresent(s.id, d)).length;
    const pct = relevantDates.length > 0 ? Math.round((present / relevantDates.length) * 100) : 0;
    return `<tr>
      <td class="cell-center">${startIndex + i + 1}</td>
      <td class="cell-code">${escapeHtml(s.code || "—")}</td>
      <td class="cell-name">${escapeHtml(s.name)}</td>
      ${cells}
      <td class="cell-center" style="font-weight:700;color:${pct >= 75 ? "#0d9488" : pct >= 50 ? "#d97706" : "#dc2626"}">${pct}%</td>
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
) {

  let attendance: AttendanceRecord[];
  try {
    const fresh = await AttendanceService.getAttendanceRecords(month, year);
    const queued = AttendanceQueue.getAll().filter(q => {
      const [y, m] = q.session_date.split("-").map(Number);
      return m === month && y === year;
    });
    const merged = [...fresh];
    for (const q of queued) {
      if (!merged.some(r => r.student_id === q.student_id && r.session_date === q.session_date))
        merged.push({ ...q, id: `offline-${q.student_id}-${q.session_date}`, created_at: q._queuedAt } as AttendanceRecord);
    }
    attendance = merged;
  } catch {
    attendance = _attendance;
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
      const groupCancelled = new Set(grp?.cancelled_sessions ?? []);
      const activeDates = grpDates.filter(d => !groupCancelled.has(d));
      const daysHtml = days.map(d => `<span class="day-chip">${escapeHtml(d)}</span>`).join("");

      body += `<div class="group-block">
        <div class="group-header">
          <span>${grpName}</span>
          <span class="group-meta">
            ${daysHtml}
            <span class="group-count">${grpStudents.length} طالب · ${activeDates.length} حصة</span>
          </span>
        </div>
        ${buildGroupTable(grpStudents, grpDates, groupCancelled, attendance, idx, grp)}
      </div>`;
      idx += grpStudents.length;
    });
  } else {
    const grp = groups?.find(g => g.name === groupName) ?? null;
    const days = grp
      ? grp.day_of_week.split(/\s*[,،]\s*|\s+/).map(d => d.trim()).filter(Boolean)
      : [];
    const grpDates = grp ? getGroupSessionDates(grp, month, year) : _sessionDates;
    const daysText = days.length > 0 ? ` · ${days.join(" - ")}` : "";
    body = `<p class="subtitle" style="margin-bottom:8px">${students.length} طالب · ${grpDates.filter(d => !cancelledSessions.has(d)).length} حصة فعّالة${daysText}</p>`
      + buildGroupTable(students, grpDates, cancelledSessions, attendance, 0, grp || undefined);
  }

  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>كشف حضور</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; padding: 14px; font-size: 12px; color: #111; direction: rtl; }
      h2 { text-align: center; margin-bottom: 4px; font-size: 15px; font-weight: 700; }
      .subtitle { text-align: center; color: #666; font-size: 11px; margin-bottom: 14px; }
      table { border-collapse: collapse; width: 100%; table-layout: fixed; }
      th { background: #e5f7f5; padding: 5px 4px; border: 1px solid #b2d8d8; font-size: 11px; text-align: center; white-space: nowrap; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      td { border: 1px solid #ccc; padding: 4px 5px; font-size: 11px; vertical-align: middle; overflow: hidden; }
      .col-num { width: 26px; } .col-code { width: 70px; } .col-name { width: 140px; } .col-pct { width: 42px; }
      .cell-center { text-align: center; }
      .cell-code { text-align: center; font-family: monospace; font-size: 11px; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .cell-name { font-weight: 600; font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .group-block { margin-bottom: 20px; }
      .group-header { background: #0d9488; color: #fff; padding: 6px 10px; font-weight: 700; font-size: 12px; border-radius: 5px 5px 0 0; display: flex; align-items: center; justify-content: space-between; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .group-meta { display: flex; align-items: center; gap: 6px; font-weight: 400; font-size: 11px; }
      .group-count { opacity: 0.9; white-space: nowrap; }
      .day-chip { background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.4); border-radius: 3px; padding: 1px 6px; font-size: 10px; font-weight: 600; white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

      @media print { body { padding: 0; margin: 0; } .group-block { page-break-inside: avoid; } }
      @page { margin: 8mm; size: A4 landscape; }
    </style>
    </head><body>
    <h2>كشف الحضور — ${escapeHtml(groupName)} — ${arabicMonths[month - 1]} ${year}</h2>
    <p class="subtitle">${new Date().toLocaleDateString("ar-EG")}</p>
    ${body}
    </body></html>`;

  await printInPlace({ html });
}
