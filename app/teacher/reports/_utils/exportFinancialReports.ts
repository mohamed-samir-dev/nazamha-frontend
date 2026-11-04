import type {
  FinancialKPIs,
  MonthlySummaryRow,
  StageRevenueRow,
  GroupRevenueRow,
  PaymentTransactionRow,
  OutstandingStudentRow,
} from "../_types/financialTypes";
import { printHtml } from "@/lib/printHtml";

export async function exportFinancialReportToExcel(params: {
  kpis: FinancialKPIs;
  periodLabel: string;
  monthlySummary: MonthlySummaryRow[];
  stageRevenue: StageRevenueRow[];
  groupRevenue: GroupRevenueRow[];
  transactions: PaymentTransactionRow[];
  outstandingStudents: OutstandingStudentRow[];
}) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const dateStr = new Date().toISOString().split("T")[0];

  const headerFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF0F766E" }, // Teal
  };
  const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 11 };

  // 1. KPI Sheet
  const kpiSheet = workbook.addWorksheet("المؤشرات المالية", {
    views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
  });
  kpiSheet.columns = [
    { header: "المؤشر المالي", key: "metric", width: 35 },
    { header: "القيمة", key: "value", width: 25 },
    { header: "ملاحظات", key: "notes", width: 40 },
  ];
  kpiSheet.getRow(1).height = 28;
  kpiSheet.getRow(1).eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const kpiRows = [
    { metric: "فترة التقرير", value: params.periodLabel, notes: "" },
    { metric: "إجمالي الإيرادات المحصلة", value: `${params.kpis.totalCollected.toLocaleString()} ج.م`, notes: "تشمل الاشتراكات ومبيعات الكتب الفعلية" },
    { metric: "إيرادات الاشتراكات المحصلة", value: `${params.kpis.subscriptionCollected.toLocaleString()} ج.م`, notes: "بناءً على تاريخ الدفع الفعلي" },
    { metric: "إيرادات مبيعات الكتب", value: `${params.kpis.bookCollected.toLocaleString()} ج.م`, notes: "مبيعات الكتب النشطة خلال الفترة" },
    { metric: "إجمالي المبالغ المستحقة", value: `${params.kpis.totalDue.toLocaleString()} ج.م`, notes: "الالتزامات المستحقة للشهور المفعلة" },
    { metric: "إجمالي المتأخرات غير المسددة", value: `${params.kpis.outstandingDebt.toLocaleString()} ج.م`, notes: "التزامات حلت مواعيدها ولم تسدد" },
    { metric: "نسبة التحصيل", value: `${params.kpis.collectionRate}%`, notes: "محسوبة على أساس المبالغ" },
    { metric: "إجمالي المصروفات", value: `${params.kpis.totalExpenses.toLocaleString()} ج.م`, notes: "فواتير ورواتب ومصروفات مدرس" },
    { metric: "صافي الأرباح", value: `${params.kpis.netProfit.toLocaleString()} ج.م`, notes: "الإيرادات المحصلة − المصروفات" },
    { metric: "عدد الطلاب المسددين", value: `${params.kpis.payingStudentsCount} طالب`, notes: "" },
    { metric: "عدد الطلاب ذوي المتأخرات", value: `${params.kpis.unpaidStudentsCount} طالب`, notes: "" },
  ];

  kpiRows.forEach((r) => {
    const row = kpiSheet.addRow(r);
    row.height = 22;
    row.eachCell((c) => {
      c.alignment = { vertical: "middle", horizontal: "right" };
    });
  });

  // 2. Monthly Summary Sheet
  if (params.monthlySummary.length > 0) {
    const mSheet = workbook.addWorksheet("الملخص الشهري", {
      views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
    });
    mSheet.columns = [
      { header: "الشهر", key: "month", width: 20 },
      { header: "الحالة", key: "status", width: 16 },
      { header: "المستحق (ج.م)", key: "due", width: 18 },
      { header: "المحصل (ج.م)", key: "collected", width: 18 },
      { header: "المتبقي (ج.م)", key: "remaining", width: 18 },
      { header: "نسبة التحصيل", key: "rate", width: 16 },
      { header: "المسددين", key: "paying", width: 14 },
      { header: "المتعثرين", key: "debt", width: 14 },
      { header: "المصروفات (ج.م)", key: "expenses", width: 18 },
      { header: "صافي الربح (ج.م)", key: "profit", width: 18 },
    ];
    mSheet.getRow(1).height = 28;
    mSheet.getRow(1).eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    params.monthlySummary.forEach((m) => {
      const row = mSheet.addRow({
        month: `${m.name} ${m.year}`,
        status: m.isActive ? (m.isCurrentMonth ? "الشهر الحالي" : "مفعّل") : "غير مفعّل",
        due: m.due,
        collected: m.collected,
        remaining: m.remaining,
        rate: `${m.collectionRate}%`,
        paying: m.payingCount,
        debt: m.debtCount,
        expenses: m.expenses,
        profit: m.netProfit,
      });
      row.height = 20;
      row.eachCell((c) => {
        c.alignment = { vertical: "middle", horizontal: "center" };
      });
    });
  }

  // 3. Transactions Sheet
  if (params.transactions.length > 0) {
    const txSheet = workbook.addWorksheet("سجل عمليات الدفع", {
      views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
    });
    txSheet.columns = [
      { header: "اسم الطالب", key: "studentName", width: 28 },
      { header: "الكود", key: "code", width: 16 },
      { header: "المجموعة", key: "group", width: 22 },
      { header: "المرحلة", key: "grade", width: 22 },
      { header: "شهر الاشتراك", key: "month", width: 18 },
      { header: "تاريخ الدفع", key: "paidAt", width: 22 },
      { header: "المبلغ المدفوع (ج.م)", key: "amount", width: 20 },
      { header: "طريقة الدفع", key: "method", width: 18 },
      { header: "رقم المرجع / الإيصال", key: "receipt", width: 25 },
    ];
    txSheet.getRow(1).height = 28;
    txSheet.getRow(1).eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    params.transactions.forEach((tx) => {
      const row = txSheet.addRow({
        studentName: tx.studentName,
        code: tx.studentCode || "—",
        group: tx.groupName,
        grade: tx.gradeName,
        month: tx.monthLabel,
        paidAt: tx.paidAt,
        amount: tx.amount,
        method: tx.method,
        receipt: tx.receiptNumber || "—",
      });
      row.height = 20;
      row.eachCell((c) => {
        c.alignment = { vertical: "middle", horizontal: "center" };
      });
    });
  }

  // 4. Outstanding Students Sheet
  if (params.outstandingStudents.length > 0) {
    const outSheet = workbook.addWorksheet("الطلاب المتأخرين", {
      views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
    });
    outSheet.columns = [
      { header: "اسم الطالب", key: "studentName", width: 28 },
      { header: "الكود", key: "code", width: 16 },
      { header: "المجموعة", key: "group", width: 22 },
      { header: "المرحلة", key: "grade", width: 22 },
      { header: "شهور التأخير", key: "months", width: 35 },
      { header: "إجمالي المستحق (ج.م)", key: "due", width: 20 },
      { header: "المتبقي (ج.م)", key: "remaining", width: 20 },
      { header: "حالة التأخير", key: "status", width: 22 },
    ];
    outSheet.getRow(1).height = 28;
    outSheet.getRow(1).eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    params.outstandingStudents.forEach((st) => {
      const row = outSheet.addRow({
        studentName: st.studentName,
        code: st.studentCode || "—",
        group: st.groupName,
        grade: st.gradeName,
        months: st.overdueMonths.map((m) => m.label).join("، "),
        due: st.originalAmount,
        remaining: st.remainingBalance,
        status: st.statusLabel,
      });
      row.height = 20;
      row.eachCell((c) => {
        c.alignment = { vertical: "middle", horizontal: "center" };
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `تقرير_مالي_${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printFinancialStatement(params: {
  kpis: FinancialKPIs;
  periodLabel: string;
  monthlySummary: MonthlySummaryRow[];
  stageRevenue: StageRevenueRow[];
  groupRevenue: GroupRevenueRow[];
  transactions: PaymentTransactionRow[];
  outstandingStudents: OutstandingStudentRow[];
}) {
  const printDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const kpisHtml = `
    <div class="kpi-grid">
      <div class="kpi-card highlight">
        <div class="lbl">إجمالي المحصل</div>
        <div class="val">${params.kpis.totalCollected.toLocaleString()} ج.م</div>
        <div class="sub">اشتراكات: ${params.kpis.subscriptionCollected.toLocaleString()} | كتب: ${params.kpis.bookCollected.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="lbl">إجمالي المستحق</div>
        <div class="val">${params.kpis.totalDue.toLocaleString()} ج.م</div>
        <div class="sub">للشهور المفعلة في الفترة</div>
      </div>
      <div class="kpi-card red">
        <div class="lbl">المتأخرات غير المسددة</div>
        <div class="val red">${params.kpis.outstandingDebt.toLocaleString()} ج.م</div>
        <div class="sub">${params.kpis.unpaidStudentsCount} طالب عليهم التزامات</div>
      </div>
      <div class="kpi-card">
        <div class="lbl">نسبة التحصيل</div>
        <div class="val">${params.kpis.collectionRate}%</div>
        <div class="sub">${params.kpis.payingStudentsCount} طالب مسدد</div>
      </div>
      <div class="kpi-card">
        <div class="lbl">إجمالي المصروفات</div>
        <div class="val red">${params.kpis.totalExpenses.toLocaleString()} ج.م</div>
        <div class="sub">فواتير ورواتب ومصروفات</div>
      </div>
      <div class="kpi-card ${params.kpis.netProfit < 0 ? "red" : "green"}">
        <div class="lbl">صافي الأرباح</div>
        <div class="val ${params.kpis.netProfit < 0 ? "red" : "green"}">${params.kpis.netProfit.toLocaleString()} ج.م</div>
        <div class="sub">الإيرادات − المصروفات</div>
      </div>
    </div>
  `;

  const monthlyRowsHtml = params.monthlySummary
    .map(
      (m) => `
      <tr class="${!m.isActive ? "inactive-row" : ""}">
        <td><strong>${m.name} ${m.year}</strong> ${m.isCurrentMonth ? "(الحالي)" : ""}</td>
        <td>${m.isActive ? "مفعّل" : "غير مفعّل"}</td>
        <td>${m.due.toLocaleString()} ج.م</td>
        <td>${m.collected.toLocaleString()} ج.م</td>
        <td class="${m.remaining > 0 ? "text-red" : ""}">${m.remaining.toLocaleString()} ج.م</td>
        <td>${m.collectionRate}%</td>
        <td>${m.payingCount}</td>
        <td>${m.debtCount}</td>
        <td>${m.expenses.toLocaleString()} ج.م</td>
        <td class="${m.netProfit < 0 ? "text-red" : "text-green"}">${m.netProfit.toLocaleString()} ج.م</td>
      </tr>
    `
    )
    .join("");

  const stagesRowsHtml = params.stageRevenue
    .map(
      (s) => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>${s.totalStudents}</td>
        <td>${s.paidStudents}</td>
        <td>${s.totalDue.toLocaleString()} ج.م</td>
        <td>${s.totalCollected.toLocaleString()} ج.م</td>
        <td class="${s.totalOutstanding > 0 ? "text-red" : ""}">${s.totalOutstanding.toLocaleString()} ج.م</td>
        <td>${s.collectionRate}%</td>
      </tr>
    `
    )
    .join("");

  const groupsRowsHtml = params.groupRevenue
    .slice(0, 20)
    .map(
      (g) => `
      <tr>
        <td><strong>${g.name}</strong></td>
        <td>${g.gradeName}</td>
        <td>${g.totalStudents}</td>
        <td>${g.paidStudents}</td>
        <td>${g.totalDue.toLocaleString()} ج.م</td>
        <td>${g.totalCollected.toLocaleString()} ج.م</td>
        <td class="${g.remaining > 0 ? "text-red" : ""}">${g.remaining.toLocaleString()} ج.م</td>
        <td>${g.collectionRate}%</td>
      </tr>
    `
    )
    .join("");

  const html = `<!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8"/>
    <title>التقرير المالي — ${params.periodLabel}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", sans-serif; padding: 24px 32px; color: #0f172a; direction: rtl; background: #fff; line-height: 1.5; font-size: 13px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #0f766e; margin-bottom: 20px; }
      .brand { font-size: 22px; font-weight: 800; color: #0f766e; }
      .title { font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 4px; }
      .meta { text-align: left; font-size: 12px; color: #64748b; }
      .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
      .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #f8fafc; }
      .kpi-card.highlight { border-color: #0f766e; background: #f0fdfa; }
      .kpi-card .lbl { font-size: 11px; color: #64748b; margin-bottom: 4px; }
      .kpi-card .val { font-size: 18px; font-weight: 800; color: #0f172a; }
      .kpi-card .sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .val.red, .text-red { color: #dc2626 !important; }
      .val.green, .text-green { color: #16a34a !important; }
      h3 { font-size: 15px; font-weight: 700; margin: 20px 0 10px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: right; }
      th { background: #f1f5f9; font-weight: 700; color: #334155; }
      tr.inactive-row { background: #f8fafc; color: #94a3b8; }
      .footer { text-align: center; margin-top: 28px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
      @media print {
        body { padding: 12px; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand">نظامها — Nazamha</div>
        <div class="title">كشف الحساب والتقرير المالي — ${params.periodLabel}</div>
      </div>
      <div class="meta">
        <div>تاريخ الإصدار: ${printDate}</div>
        <div>نظام إدارة المراكز والدروس</div>
      </div>
    </div>

    ${kpisHtml}

    ${
      params.monthlySummary.length > 0
        ? `
      <h3>الملخص المالي الشهري</h3>
      <table>
        <thead>
          <tr>
            <th>الشهر</th><th>الحالة</th><th>المستحق</th><th>المحصل</th><th>المتبقي</th>
            <th>نسبة التحصيل</th><th>المسددين</th><th>المتعثرين</th><th>المصروفات</th><th>صافي الربح</th>
          </tr>
        </thead>
        <tbody>${monthlyRowsHtml}</tbody>
      </table>
    `
        : ""
    }

    ${
      params.stageRevenue.length > 0
        ? `
      <h3>الإيرادات حسب المرحلة الدراسية</h3>
      <table>
        <thead>
          <tr>
            <th>المرحلة</th><th>إجمالي الطلاب</th><th>المسددين</th><th>المستحق</th><th>المحصل</th><th>المتأخرات</th><th>نسبة التحصيل</th>
          </tr>
        </thead>
        <tbody>${stagesRowsHtml}</tbody>
      </table>
    `
        : ""
    }

    ${
      params.groupRevenue.length > 0
        ? `
      <h3>الإيرادات حسب المجموعات</h3>
      <table>
        <thead>
          <tr>
            <th>المجموعة</th><th>المرحلة</th><th>إجمالي الطلاب</th><th>المسددين</th><th>المستحق</th><th>المحصل</th><th>المتبقي</th><th>نسبة التحصيل</th>
          </tr>
        </thead>
        <tbody>${groupsRowsHtml}</tbody>
      </table>
    `
        : ""
    }

    <div class="footer">
      تم إنشاء هذا التقرير آلياً عبر منصة نظامها التعليمية · الأرقام خاضعة لسجلات المعاملات المالية المعتمدة
    </div>
  </body>
  </html>`;

  printHtml(html);
}
