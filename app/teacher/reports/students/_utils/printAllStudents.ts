import { Student, Grade, Group, Exam } from "@/lib/types";
import { AlertItem } from "../_components/types";
import { getConsecutiveAbsences, getAlerts } from "../_components/reportUtils";
import { printHtml } from "@/lib/printHtml";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

function alertLabel(a: AlertItem): string {
  if (a.type === "star") return "⭐ " + a.title;
  if (a.type === "expulsion") return "🔴 " + a.title;
  if (a.type === "absence") return "🟡 " + a.title;
  return "💳 " + a.title;
}

export function printAllStudentsReport(
  students: Student[],
  grades: Grade[],
  groups: Group[],
  getAttendance: (id: string) => { present: number; absent: number; total: number },
  isStudentPaid: (id: string) => boolean,
  last10Sessions: Set<string>,
  studentSubsInfo: Map<string, { lastPaidMonth: string; arrears: number; hasAllPaid: boolean }>,
  selectedMonthIndex: number,
  selectedYear: number,
  getLastExam?: (id: string) => (Exam & { score: number | null }) | null
) {
  const rows = students.map((student, idx) => {
    const att = getAttendance(student.id);
    const total = att.total;
    const pct = total > 0 ? Math.round((att.present / total) * 100) : 0;
    const gradeName = grades.find((g) => g.id === student.grade_id)?.name ?? "—";
    const groupName = groups.find((g) => g.id === student.group_id)?.name ?? "—";
    const subsInfo = studentSubsInfo.get(student.id) ?? { lastPaidMonth: "—", arrears: 0, hasAllPaid: true };
    const { lastPaidMonth, arrears } = subsInfo;
    const consAbsences = getConsecutiveAbsences(student.id, last10Sessions, getAttendance);
    const paid = isStudentPaid(student.id);
    const alerts = getAlerts(student, att, pct, arrears, consAbsences, paid, subsInfo.hasAllPaid);

    const pctColor = pct >= 75 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
    const rowBg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
    const alertsText = alerts.length > 0 ? alerts.map(alertLabel).join(" | ") : "—";
    const arrearsText = arrears > 0 ? `${arrears} شهر` : "—";
    const lastExam = getLastExam ? getLastExam(student.id) : null;
    const examText = lastExam
      ? (lastExam.score !== null ? `${lastExam.title}: ${lastExam.score}/${lastExam.max_score}` : `${lastExam.title}: لم يُرصد`)
      : "—";

    return `
      <tr style="background:${rowBg}">
        <td style="text-align:center;color:#9ca3af;font-size:11px">${idx + 1}</td>
        <td>
          <div style="font-weight:700;font-size:13px">${student.name}</div>
          ${student.code ? `<div style="font-family:monospace;color:#6b7280;font-size:11px">${student.code}</div>` : ""}
        </td>
        <td style="text-align:center;font-size:11px;color:#374151">${gradeName}</td>
        <td style="text-align:center;font-size:11px;color:#374151">${groupName}</td>
        <td style="text-align:center;font-weight:700;color:#16a34a">${att.present}</td>
        <td style="text-align:center;font-weight:700;color:${att.absent > 0 ? "#dc2626" : "#9ca3af"}">${att.absent}</td>
        <td style="text-align:center;color:#374151">${total}</td>
        <td style="text-align:center;font-weight:700;color:${pctColor}">${pct}%</td>
        <td style="text-align:center;font-size:11px;color:#374151">${lastPaidMonth}</td>
        <td style="text-align:center;font-size:11px;color:${arrears > 0 ? "#dc2626" : "#9ca3af"};font-weight:${arrears > 0 ? "700" : "400"}">${arrearsText}</td>
        <td style="font-size:10px;color:#374151;max-width:180px">${alertsText}</td>
        <td style="font-size:10px;color:#374151;max-width:160px">${examText}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>تقارير الطلاب — ${arabicMonths[selectedMonthIndex]} ${selectedYear}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; direction: rtl; color: #111; background: #fff; padding: 16px; }
    h1 { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
    .subtitle { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #111827 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead th { padding: 9px 8px; color: #fff; font-weight: 700; font-size: 11px; text-align: center; white-space: nowrap; }
    thead th:nth-child(2) { text-align: right; }
    tbody td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    tbody td:nth-child(2) { text-align: right; }
    .footer { margin-top: 14px; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 8px; }

    .mobile-print-btn {
      display: none;
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #111;
      color: #fff;
      border: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-family: inherit;
    }

    @media print {
      body { padding: 0; }
      .mobile-print-btn { display: none !important; }
      @page { size: A4 landscape; margin: 10mm 12mm; }
    }

    @media (max-width: 768px) {
      .mobile-print-btn { display: block; }
    }
  </style>
</head>
<body>
  <h1>تقارير الطلاب</h1>
  <div class="subtitle">${arabicMonths[selectedMonthIndex]} ${selectedYear} — ${students.length} طالب</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th style="text-align:right">الطالب</th>
        <th>الصف</th>
        <th>المجموعة</th>
        <th>حضور</th>
        <th>غياب</th>
        <th>الإجمالي</th>
        <th>النسبة</th>
        <th>آخر شهر دفع</th>
        <th>شهور متأخرة</th>
        <th style="text-align:right">التنبيهات</th>
        <th style="text-align:right">آخر امتحان</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>تم الإنشاء: ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</span>
    <span>إجمالي الطلاب: ${students.length}</span>
  </div>
  <button class="mobile-print-btn" onclick="window.print()">🖨 طباعة التقرير</button>
  <script>window.onload = () => { setTimeout(() => { window.print(); }, 1000); }<\/script>
</body>
</html>`;

  printHtml(html);
}
