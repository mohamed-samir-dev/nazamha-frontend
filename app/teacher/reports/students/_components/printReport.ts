import { Student, Exam } from "@/lib/types";
import { AlertItem, arabicMonths } from "./types";
import { printHtml } from "@/lib/printHtml";

export function printStudentReport(
  student: Student,
  att: { present: number; absent: number },
  pct: number,
  lastPaidMonth: string,
  arrears: number,
  gradeName: string,
  groupName: string,
  selectedMonthIndex: number,
  selectedYear: number,
  alerts: AlertItem[],
  receivedBookNames: string[] = [],
  lastExam?: (Exam & { score: number | null }) | null
) {
  const total        = att.present + att.absent;
  const monthLabel   = `${arabicMonths[selectedMonthIndex]} ${selectedYear}`;
  const pctColor     = pct >= 75 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
  const arrearsColor = arrears === 0 ? "#16a34a" : "#dc2626";
  const printDate    = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

  /* ── جدول 1: بيانات الطالب وولي الأمر (4 أعمدة: label | val | label | val) ── */
  const infoAndParentRows = [
    ["الاسم الكامل",      `<strong>${student.name}</strong>`,                   "رقم هاتف ولي الأمر", student.parent_phone  || "—"],
    ["كود الطالب",        student.code         ? `<span class="mono">${student.code}</span>` : "—",  "وظيفة ولي الأمر",    student.parent_job    || "—"],
    ["المرحلة الدراسية",  gradeName            || "—",                          "البريد الإلكتروني",  student.student_email || "—"],
    ["المجموعة",          groupName            || "—",                          "",                   ""],
  ];

  const infoTableRows = infoAndParentRows.map((r, i) =>
    `<tr${i % 2 !== 0 ? ' class="alt"' : ""}>
      <td class="lbl">${r[0]}</td><td class="val">${r[1]}</td>
      <td class="lbl">${r[2]}</td><td class="val">${r[3]}</td>
    </tr>`
  ).join("");

  /* ── جدول 2: الحضور + المالية + التنبيهات (4 أعمدة) ── */
  const alertText = alerts.length === 0
    ? "لا توجد تنبيهات"
    : alerts.map((a) => a.title).join(" | ");

  // الجانب الأيمن: حضور (ثابت دايماً)
  const leftCol: [string, string][] = [
    ["الشهر",         monthLabel],
    ["إجمالي الحصص", `${total} حصة`],
    ["أيام الحضور",  `<span style="color:#16a34a;font-weight:700">${att.present}</span>`],
    ["أيام الغياب",  `<span style="color:#dc2626;font-weight:700">${att.absent}</span>`],
    ["نسبة الحضور",  `<span style="color:${pctColor};font-weight:800">${pct}%</span>`],
  ];

  // الجانب الأيسر: مالية — بس الصفوف اللي فيها بيانات
  const rightCol: [string, string][] = [
    ["آخر شهر دفع", lastPaidMonth || "—"],
    ["شهور متأخرة", `<span style="color:${arrearsColor};font-weight:700">${arrears > 0 ? arrears + " شهر" : "لا يوجد"}</span>`],
    ...(student.discount_value && student.discount_value > 0
      ? [["الخصم المطبق", `${student.discount_value} جنيه${student.discount_reason ? ` (${student.discount_reason})` : ""}`]] as [string,string][]
      : []),
    ...(student.custom_monthly_price != null
      ? [["السعر الشهري", `${student.custom_monthly_price} جنيه`]] as [string,string][]
      : []),
    ...(lastExam
      ? [["آخر امتحان", lastExam.score !== null
          ? `<strong>${lastExam.title}</strong>: <span style="color:${lastExam.score / lastExam.max_score >= 0.5 ? "#16a34a" : "#dc2626"};font-weight:700">${lastExam.score}/${lastExam.max_score}</span>`
          : `<strong>${lastExam.title}</strong>: لم يُرصد`]] as [string,string][]
      : []),
    ["التنبيهات", `<span style="color:#374151">${alertText}</span>`],
  ];

  const maxRows = Math.max(leftCol.length, rightCol.length);
  const statsTableRows = Array.from({ length: maxRows }, (_, i) => {
    const l = leftCol[i]  || ["", ""];
    const r = rightCol[i] || ["", ""];
    return `<tr${i % 2 !== 0 ? ' class="alt"' : ""}>
      <td class="lbl">${l[0]}</td><td class="val">${l[1]}</td>
      <td class="lbl">${r[0]}</td><td class="val">${r[1]}</td>
    </tr>`;
  }).join("");

  /* ── progress bar ── */
  const progressBar = total > 0 ? `
    <div class="progress-wrap">
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%;background:${pctColor}"></div>
      </div>
      <span class="progress-label" style="color:${pctColor}">${pct}%</span>
    </div>` : "";

  /* ── جدول الكتب ── */
  const booksTable = receivedBookNames.length > 0 ? `
    <div class="section-title">الكتب المستلمة</div>
    <table>
      ${receivedBookNames.map((name, i) =>
        `<tr${i % 2 !== 0 ? ' class="alt"' : ""}><td class="lbl" style="width:40px">${i + 1}</td><td class="val">${name}</td></tr>`
      ).join("")}
    </table>` : "";

  /* ── ملاحظات ── */
  const notesBlock = student.notes ? `
    <div class="section-title">ملاحظات</div>
    <div class="notes-box">${student.notes}</div>` : "";

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>تقرير الطالب — ${student.name}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      direction: rtl;
      color: #111;
      background: #fff;
      padding: 22px 26px;
      font-size: 13px;
      line-height: 1.5;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 12px;
      margin-bottom: 18px;
      border-bottom: 3px solid #111;
    }
    .header h1 { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
    .header p  { font-size: 12px; color: #6b7280; }
    .header-meta { text-align: left; }
    .badge-month {
      display: inline-block;
      background: #111;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 12px;
      border-radius: 20px;
      margin-bottom: 3px;
    }
    .print-date { font-size: 10px; color: #9ca3af; }

    /* Section title */
    .section-title {
      background: #111;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 12px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* Block wrapper */
    .block {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 14px;
    }

    /* Tables */
    table { width: 100%; border-collapse: collapse; }
    tr.alt td { background: #f9fafb; }
    td { padding: 7px 11px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    td.lbl {
      color: #6b7280;
      font-size: 11px;
      font-weight: 600;
      width: 18%;
      white-space: nowrap;
      border-left: 1px solid #f3f4f6;
    }
    td.val { color: #111; font-weight: 500; width: 32%; }
    .mono { font-family: "Courier New", monospace; font-weight: 700; letter-spacing: 0.05em; }

    /* Progress */
    .progress-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 12px;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
    }
    .progress-track { flex: 1; height: 7px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .progress-fill  { height: 100%; border-radius: 4px; }
    .progress-label { font-size: 12px; font-weight: 800; min-width: 36px; text-align: left; }

    /* Notes */
    .notes-box { padding: 9px 12px; color: #374151; font-size: 12px; line-height: 1.7; white-space: pre-wrap; }

    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
      margin-top: 16px;
    }

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
      @page { size: A4 portrait; margin: 12mm 14mm; }
    }

    @media (max-width: 768px) {
      .mobile-print-btn { display: block; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <h1>تقرير الطالب</h1>
      <p>${student.name}${student.code ? ` &nbsp;·&nbsp; <span class="mono">${student.code}</span>` : ""}</p>
    </div>
    <div class="header-meta">
      <div class="badge-month">${monthLabel}</div>
      <div class="print-date">تاريخ الطباعة: ${printDate}</div>
    </div>
  </div>

  <!-- جدول 1: بيانات الطالب وولي الأمر -->
  <div class="block">
    <div class="section-title">بيانات الطالب وولي الأمر</div>
    <table>${infoTableRows}</table>
  </div>

  <!-- جدول 2: الحضور والمالية والتنبيهات -->
  <div class="block">
    <div class="section-title">الحضور والغياب والحالة المالية</div>
    <table>${statsTableRows}</table>
    ${progressBar}
  </div>

  ${receivedBookNames.length > 0 ? `<div class="block">${booksTable}</div>` : ""}
  ${student.notes ? `<div class="block">${notesBlock}</div>` : ""}

  <div class="footer">
    <span>نظام متابعة الطلاب</span>
    <span>${student.name} &nbsp;·&nbsp; ${monthLabel}</span>
  </div>

  <button class="mobile-print-btn" onclick="window.print()">🖨 طباعة التقرير</button>
  <script>window.onload = () => { setTimeout(() => { window.print(); }, 1000); }<\/script>
</body>
</html>`;

  printHtml(html, { inPlace: true });
}
