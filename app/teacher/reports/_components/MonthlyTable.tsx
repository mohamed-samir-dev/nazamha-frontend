"use client";

import { Calendar, Printer } from "lucide-react";
import { printHtml } from "@/lib/printHtml";

export interface MonthReport {
  name: string;
  paidCount: number;
  subscriptionEarnings: number;
  monthExpenses: number;
  bookEarnings: number;
  netProfit: number;
  percentage: number;
  isCurrentMonth: boolean;
}

interface Props {
  monthsReport: MonthReport[];
  onExportCSV?: () => void;
  selectedYear?: number;
}

export function MonthlyTable({ monthsReport, selectedYear }: Props) {
  function handlePrint() {
    const totalSubs = monthsReport.reduce((s, m) => s + m.subscriptionEarnings, 0);
    const totalBooks = monthsReport.reduce((s, m) => s + m.bookEarnings, 0);
    const totalGross = totalSubs + totalBooks;
    const totalExpenses = monthsReport.reduce((s, m) => s + m.monthExpenses, 0);
    const totalNet = monthsReport.reduce((s, m) => s + m.netProfit, 0);
    const totalPaid = monthsReport.reduce((s, m) => s + m.paidCount, 0);
    const avgPercent = Math.round(
      monthsReport.filter((m) => m.paidCount > 0).reduce((s, m) => s + m.percentage, 0) /
        (monthsReport.filter((m) => m.paidCount > 0).length || 1)
    );

    const rows = monthsReport
      .map((m) => {
        const gross = m.subscriptionEarnings + m.bookEarnings;
        const netRed = m.netProfit < 0 ? "color:#dc2626;" : "";
        const expRed = m.monthExpenses > 0 ? "color:#dc2626;" : "";
        return `<tr>
        <td>${m.name}${m.isCurrentMonth ? " (الحالي)" : ""}</td>
        <td>${m.subscriptionEarnings.toLocaleString()} ج.م</td>
        <td>${m.bookEarnings > 0 ? m.bookEarnings.toLocaleString() + " ج.م" : "—"}</td>
        <td>${gross.toLocaleString()} ج.م</td>
        <td>${m.paidCount} طالب</td>
        <td style="${expRed}">${m.monthExpenses > 0 ? m.monthExpenses.toLocaleString() + " ج.م" : "—"}</td>
        <td style="font-weight:700;${netRed}">${m.netProfit.toLocaleString()} ج.م</td>
        <td>${m.percentage}%</td>
      </tr>`;
      })
      .join("");

    const totalNetRed = totalNet < 0 ? "color:#dc2626;" : "";
    const totalExpRed = totalExpenses > 0 ? "color:#dc2626;" : "";
    const printDate = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>التقرير المالي الشهري</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;padding:28px 32px;color:#111;direction:rtl;background:#fff}
      .header{margin-bottom:22px;padding-bottom:14px;border-bottom:1px solid #ddd}
      .header h2{font-size:20px;font-weight:800;margin-bottom:4px}
      .header p{font-size:12px;color:#666}
      .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px}
      .summary-card{border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px}
      .summary-card .lbl{font-size:11px;color:#666;margin-bottom:4px}
      .summary-card .val{font-size:17px;font-weight:800;color:#111}
      .summary-card .val.red{color:#dc2626}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th,td{border:1px solid #ddd;padding:8px 10px;text-align:right}
      th{background:#f5f5f5;font-weight:700}
      .total-row td{font-weight:800;background:#f5f5f5;border-top:2px solid #bbb}
      .footer{text-align:center;margin-top:18px;font-size:11px;color:#aaa}
      @media print{body{padding:16px}}
    </style></head><body>
<div class="header">
  <h2>التقرير المالي الشهري${selectedYear ? " — " + selectedYear : ""}</h2>
  <p>تاريخ الطباعة: ${printDate}</p>
</div>
<div class="summary">
  <div class="summary-card"><div class="lbl">إيرادات الاشتراكات</div><div class="val">${totalSubs.toLocaleString()} ج.م</div></div>
  <div class="summary-card"><div class="lbl">أرباح الكتب</div><div class="val">${totalBooks.toLocaleString()} ج.م</div></div>
  <div class="summary-card"><div class="lbl">إجمالي الإيرادات</div><div class="val">${totalGross.toLocaleString()} ج.م</div></div>
  <div class="summary-card"><div class="lbl">إجمالي المصروفات</div><div class="val ${totalExpenses > 0 ? "red" : ""}">${totalExpenses.toLocaleString()} ج.م</div></div>
  <div class="summary-card"><div class="lbl">صافي الأرباح</div><div class="val ${totalNet < 0 ? "red" : ""}">${totalNet.toLocaleString()} ج.م</div></div>
  <div class="summary-card"><div class="lbl">إجمالي الدفعات</div><div class="val">${totalPaid} طالب</div></div>
</div>
<table>
  <thead><tr><th>الشهر</th><th>إيرادات الاشتراكات</th><th>أرباح الكتب</th><th>إجمالي الإيرادات</th><th>الطلاب الدافعين</th><th>المصروفات</th><th>صافي الربح</th><th>نسبة السداد</th></tr></thead>
  <tbody>${rows}
  <tr class="total-row">
    <td>الإجمالي</td>
    <td>${totalSubs.toLocaleString()} ج.م</td>
    <td>${totalBooks > 0 ? totalBooks.toLocaleString() + " ج.م" : "—"}</td>
    <td>${totalGross.toLocaleString()} ج.م</td>
    <td>${totalPaid} طالب</td>
    <td style="${totalExpRed}">${totalExpenses > 0 ? totalExpenses.toLocaleString() + " ج.م" : "—"}</td>
    <td style="${totalNetRed}">${totalNet.toLocaleString()} ج.م</td>
    <td>${avgPercent}%</td>
  </tr></tbody>
</table>
 <div class="footer">Student Tracker — تم الإنشاء تلقائياً</div>
</body></html>`;

    printHtml(html);
  }

  const maxEarnings = Math.max(...monthsReport.map((m) => m.subscriptionEarnings + m.bookEarnings), 1);

  return (
    <section className="glass-panel panel-content" style={{ marginTop: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "clamp(0.95rem, 2vw, 1.1rem)", fontWeight: 700 }}>
          <Calendar size={18} style={{ color: "var(--color-info)", flexShrink: 0 }} />
          التقرير المالي الشهري
        </h2>
        <button
          onClick={handlePrint}
          className="export-btn"
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem" }}
        >
          <Printer size={14} />
          طباعة
        </button>
      </div>

      <div className="report-table-wrapper table-container">
        <table className="report-table" style={{ fontSize: "0.85rem" }}>
          <thead>
            <tr>
              <th style={{ width: "80px" }}>الشهر</th>
              <th>الإيرادات</th>
              <th>الطلاب الدافعين</th>
              <th>الكتب</th>
              <th>المصروفات</th>
              <th>صافي الربح</th>
              <th style={{ width: "120px" }}>نسبة السداد</th>
            </tr>
          </thead>
          <tbody>
            {monthsReport.map((month) => {
              const totalIncome = month.subscriptionEarnings + month.bookEarnings;
              const barWidth = Math.round((totalIncome / maxEarnings) * 100);

              return (
                <tr
                  key={month.name}
                  style={{
                    background: month.isCurrentMonth ? "rgba(20,184,166,0.05)" : undefined,
                    borderRight: month.isCurrentMonth ? "3px solid var(--color-teal)" : "3px solid transparent",
                  }}
                >
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: month.isCurrentMonth ? 700 : 600, color: month.isCurrentMonth ? "var(--color-teal)" : "var(--text-primary)" }}>
                        {month.name}
                      </span>
                      {month.isCurrentMonth && (
                        <span style={{ fontSize: "0.6rem", padding: "1px 5px", borderRadius: "4px", background: "rgba(20,184,166,0.15)", color: "var(--color-teal)", border: "1px solid rgba(20,184,166,0.3)", whiteSpace: "nowrap" }}>
                          الحالي
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <span className="monospace" style={{ fontWeight: 600, color: totalIncome > 0 ? "var(--color-teal)" : "var(--text-muted)" }}>
                        {totalIncome.toLocaleString()} ج.م
                      </span>
                      <div className="progress-inline" style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.05)", overflow: "hidden", width: "80px" }}>
                        <div style={{
                          height: "100%", borderRadius: "2px",
                          background: month.isCurrentMonth ? "var(--color-teal)" : "rgba(20,184,166,0.5)",
                          width: `${barWidth}%`,
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  </td>

                  <td className="monospace" style={{ color: "var(--text-secondary)" }}>
                    {month.paidCount} طالب
                  </td>

                  <td className="monospace" style={{ color: month.bookEarnings > 0 ? "var(--color-amber)" : "var(--text-muted)" }}>
                    {month.bookEarnings > 0 ? `${month.bookEarnings.toLocaleString()} ج.م` : "—"}
                  </td>

                  <td className="monospace" style={{ color: month.monthExpenses > 0 ? "#f87171" : "var(--text-muted)" }}>
                    {month.monthExpenses > 0 ? `-${month.monthExpenses.toLocaleString()} ج.م` : "—"}
                  </td>

                  <td className="monospace" style={{
                    fontWeight: 700,
                    color: month.netProfit > 0 ? "#10b981" : month.netProfit < 0 ? "#ef4444" : "var(--text-muted)",
                  }}>
                    {month.netProfit.toLocaleString()} ج.م
                  </td>

                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span className="monospace" style={{
                        fontSize: "0.8rem", fontWeight: 700, minWidth: "32px",
                        color: month.percentage > 70 ? "#10b981" : month.percentage > 30 ? "var(--color-teal)" : "#f87171",
                      }}>
                        {month.percentage}%
                      </span>
                      <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.05)", overflow: "hidden", minWidth: "40px" }}>
                        <div style={{
                          height: "100%", borderRadius: "3px",
                          background: month.percentage > 70 ? "#10b981" : month.percentage > 30 ? "var(--color-teal)" : "#f87171",
                          width: `${month.percentage}%`,
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
