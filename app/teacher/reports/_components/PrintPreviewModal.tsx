"use client";

import React, { useState } from "react";
import { Printer, X, CheckCircle2, AlertCircle, Building2, Calendar, FileText } from "lucide-react";
import { printInPlace } from "@/lib/printInPlace";
import type {
  FinancialKPIs,
  MonthlySummaryRow,
  StageRevenueRow,
  GroupRevenueRow,
  OutstandingStudentRow,
  BookStat,
} from "../_types/financialTypes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  kpis: FinancialKPIs;
  periodLabel: string;
  teacherName?: string;
  totalStudentsCount: number;
  monthlySummary: MonthlySummaryRow[];
  stageRevenue: StageRevenueRow[];
  groupRevenue: GroupRevenueRow[];
  outstandingStudents: OutstandingStudentRow[];
  topBook: BookStat | null;
}

export function PrintPreviewModal({
  isOpen,
  onClose,
  kpis,
  periodLabel,
  teacherName = "المعلم",
  totalStudentsCount,
  monthlySummary,
  stageRevenue,
  groupRevenue,
  outstandingStudents,
  topBook,
}: Props) {
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  if (!isOpen) return null;

  const printDateStr = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const printTimeStr = new Date().toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Generates clean, high-contrast, black-and-white foundation HTML with semantic color accents
  const generateDocumentHtml = (): string => {
    const monthlyRows = monthlySummary
      .map(
        (m) => `
        <tr style="background: ${m.isCurrentMonth ? "#f0fdfa" : m.isActive ? "#ffffff" : "#f8fafc"};">
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">
            ${m.name} ${m.year} ${m.isCurrentMonth ? '<span style="font-size: 10px; color: #0f766e;">(الحالي)</span>' : ""}
          </td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; color: ${m.isActive ? "#047857" : "#64748b"}; font-weight: 600;">
            ${m.isActive ? "مفعّل" : "غير مفعّل"}
          </td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600;">
            ${m.due.toLocaleString()} ج.م
          </td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; color: #047857;">
            ${m.collected.toLocaleString()} ج.م
          </td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; color: ${m.remaining > 0 ? "#b91c1c" : "#0f172a"};">
            ${m.remaining.toLocaleString()} ج.م
          </td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700;">
            ${m.collectionRate}%
          </td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center;">${m.payingCount}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; color: ${m.debtCount > 0 ? "#b91c1c" : "#0f172a"};">
            ${m.debtCount}
          </td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: right; color: ${m.netProfit < 0 ? "#b91c1c" : "#047857"}; font-weight: 700;">
            ${m.netProfit.toLocaleString()} ج.م
          </td>
        </tr>
      `
      )
      .join("");

    const stagesRows = stageRevenue
      .map(
        (st) => `
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">${st.name}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center;">${st.totalStudents}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; color: #047857; font-weight: 600;">${st.paidStudents}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; color: #047857;">${st.totalCollected.toLocaleString()} ج.م</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600; color: ${st.totalOutstanding > 0 ? "#b91c1c" : "#0f172a"};">${st.totalOutstanding.toLocaleString()} ج.م</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700;">${st.collectionRate}%</td>
        </tr>
      `
      )
      .join("");

    const outstandingRows = outstandingStudents
      .slice(0, 15)
      .map(
        (st) => `
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">${st.studentName}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${st.studentCode || "—"}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${st.groupName}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #475569;">${st.overdueMonths.map((m) => m.label).join("، ") || "—"}</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: 800; color: #b91c1c;">${st.remainingBalance.toLocaleString()} ج.م</td>
        </tr>
      `
      )
      .join("");

    return `<!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8"/>
      <title>كشف الحساب والتقرير المالي — ${periodLabel}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", Tahoma, sans-serif;
          padding: 24px;
          color: #0f172a;
          direction: rtl;
          background: #ffffff;
          line-height: 1.45;
          font-size: 12px;
        }
        @media print {
          body { padding: 12px 16px; font-size: 11px; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #0f172a; margin-bottom: 16px;">
        <div>
          <div style="font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">منصة نظامها — Nazamha</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f766e; margin-top: 3px;">كشف الحساب والتقرير المالي المعتمد</div>
          <div style="font-size: 12px; color: #475569; margin-top: 2px; font-weight: 600;">الفترة: ${periodLabel}</div>
        </div>
        <div style="text-align: left; font-size: 11px; color: #475569; line-height: 1.6;">
          <div><strong>المعلم / الحساب:</strong> ${teacherName}</div>
          <div><strong>تاريخ الإصدار:</strong> ${printDateStr} (${printTimeStr})</div>
          <div><strong>إجمالي الطلاب المسجلين:</strong> ${totalStudentsCount} طالب</div>
        </div>
      </div>

      <!-- KPI Columns Grid -->
      <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 18px;">
        <div style="border: 1px solid #cbd5e1; border-top: 3px solid #059669; border-radius: 6px; padding: 8px 10px; background: #ffffff;">
          <div style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 2px;">إجمالي المحصل</div>
          <div style="font-size: 16px; font-weight: 900; color: #047857;">${kpis.totalCollected.toLocaleString()} ج.م</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">اشتراكات: ${kpis.subscriptionCollected.toLocaleString()} | كتب: ${kpis.bookCollected.toLocaleString()}</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-top: 3px solid #0f172a; border-radius: 6px; padding: 8px 10px; background: #ffffff;">
          <div style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 2px;">إجمالي المستحق</div>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${kpis.totalDue.toLocaleString()} ج.م</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">للشهور المفعلة للطلاب المؤهلين</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-top: 3px solid #dc2626; border-radius: 6px; padding: 8px 10px; background: #ffffff;">
          <div style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 2px;">الديون والمتأخرات</div>
          <div style="font-size: 16px; font-weight: 900; color: #b91c1c;">${kpis.outstandingDebt.toLocaleString()} ج.م</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${kpis.unpaidStudentsCount} طالب عليهم ديون</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-top: 3px solid #0d9488; border-radius: 6px; padding: 8px 10px; background: #ffffff;">
          <div style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 2px;">نسبة التحصيل</div>
          <div style="font-size: 16px; font-weight: 900; color: #0f766e;">${kpis.collectionRate}%</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${kpis.payingStudentsCount} مسددين من ${kpis.totalEligibleStudents}</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-top: 3px solid #475569; border-radius: 6px; padding: 8px 10px; background: #ffffff;">
          <div style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 2px;">إجمالي المصروفات</div>
          <div style="font-size: 16px; font-weight: 900; color: #475569;">${kpis.totalExpenses.toLocaleString()} ج.م</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">فواتير ورواتب ومصروفات</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-top: 3px solid ${kpis.netProfit < 0 ? "#dc2626" : "#059669"}; border-radius: 6px; padding: 8px 10px; background: #ffffff;">
          <div style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 2px;">صافي الأرباح</div>
          <div style="font-size: 16px; font-weight: 900; color: ${kpis.netProfit < 0 ? "#b91c1c" : "#047857"};">${kpis.netProfit.toLocaleString()} ج.م</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">المحصل − المصروفات</div>
        </div>
      </div>

      <!-- Section: Monthly Summary -->
      ${
        monthlySummary.length > 0
          ? `
        <div style="margin-bottom: 18px;">
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>■ الملخص المالي للشهور</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #0f172a; color: #ffffff;">
                <th style="padding: 7px 10px; border: 1px solid #0f172a; text-align: right;">الشهر</th>
                <th style="padding: 7px 10px; border: 1px solid #0f172a; text-align: center;">الحالة</th>
                <th style="padding: 7px 10px; border: 1px solid #0f172a; text-align: right;">المستحق</th>
                <th style="padding: 7px 10px; border: 1px solid #0f172a; text-align: right;">المحصل</th>
                <th style="padding: 7px 10px; border: 1px solid #0f172a; text-align: right;">المتبقي</th>
                <th style="padding: 7px 10px; border: 1px solid #0f172a; text-align: center;">النسبة</th>
                <th style="padding: 7px 10px; border: 1px solid #0f172a; text-align: center;">مسددين</th>
                <th style="padding: 7px 10px; border: 1px solid #0f172a; text-align: center;">متعثرين</th>
                <th style="padding: 7px 10px; border: 1px solid #0f172a; text-align: right;">صافي الربح</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyRows}
            </tbody>
          </table>
        </div>
      `
          : ""
      }

      <!-- Two-Column Section: Stages & Best Seller / Groups -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px;">
        <!-- Stages Column -->
        <div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
            <span>■ إيرادات المراحل الدراسية</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                <th style="padding: 6px 10px; border: 1px solid #1e293b; text-align: right;">المرحلة</th>
                <th style="padding: 6px 10px; border: 1px solid #1e293b; text-align: center;">الطلاب</th>
                <th style="padding: 6px 10px; border: 1px solid #1e293b; text-align: center;">سددوا</th>
                <th style="padding: 6px 10px; border: 1px solid #1e293b; text-align: right;">المحصل</th>
                <th style="padding: 6px 10px; border: 1px solid #1e293b; text-align: right;">الديون</th>
                <th style="padding: 6px 10px; border: 1px solid #1e293b; text-align: center;">النسبة</th>
              </tr>
            </thead>
            <tbody>
              ${stagesRows}
            </tbody>
          </table>
        </div>

        <!-- Best Seller & Group Highlights -->
        <div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
            <span>■ أعلى الكتب مبيعاً وأبرز المجموعات</span>
          </div>
          ${
            topBook
              ? `
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; background: #f8fafc; margin-bottom: 10px;">
              <div style="font-size: 11px; font-weight: 700; color: #475569;">الكتاب الأكثر مبيعاً في الفترة:</div>
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 3px 0;">${topBook.name}</div>
              <div style="font-size: 11px; color: #0f766e; font-weight: 700;">
                تم بيع ${topBook.count} نسخة · إجمالي مبيعات: ${topBook.earnings.toLocaleString()} ج.م
              </div>
            </div>
          `
              : ""
          }
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                <th style="padding: 6px 10px; border: 1px solid #1e293b; text-align: right;">المجموعة</th>
                <th style="padding: 6px 10px; border: 1px solid #1e293b; text-align: right;">المرحلة</th>
                <th style="padding: 6px 10px; border: 1px solid #1e293b; text-align: right;">المحصل</th>
                <th style="padding: 6px 10px; border: 1px solid #1e293b; text-align: center;">النسبة</th>
              </tr>
            </thead>
            <tbody>
              ${groupRevenue
                .slice(0, 6)
                .map(
                  (g) => `
                <tr>
                  <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 700;">${g.name}</td>
                  <td style="padding: 6px 10px; border: 1px solid #cbd5e1; color: #475569;">${g.gradeName}</td>
                  <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; color: #047857;">${g.totalCollected.toLocaleString()} ج.م</td>
                  <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700;">${g.collectionRate}%</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section: Outstanding Students Summary -->
      ${
        outstandingStudents.length > 0
          ? `
        <div style="margin-bottom: 22px;">
          <div style="font-size: 13px; font-weight: 800; color: #b91c1c; margin-bottom: 6px;">
            <span>■ كشف ملخص بالطلاب أصحاب الديون المتأخرة (أول ${Math.min(15, outstandingStudents.length)} طالب)</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #b91c1c; color: #ffffff;">
                <th style="padding: 6px 10px; border: 1px solid #b91c1c; text-align: right;">اسم الطالب</th>
                <th style="padding: 6px 10px; border: 1px solid #b91c1c; text-align: center;">الكود</th>
                <th style="padding: 6px 10px; border: 1px solid #b91c1c; text-align: right;">المجموعة</th>
                <th style="padding: 6px 10px; border: 1px solid #b91c1c; text-align: right;">الشهور المتأخرة</th>
                <th style="padding: 6px 10px; border: 1px solid #b91c1c; text-align: right;">المتبقي</th>
              </tr>
            </thead>
            <tbody>
              ${outstandingRows}
            </tbody>
          </table>
        </div>
      `
          : ""
      }

      <div style="text-align: center; margin-top: 24px; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        وثيقة مالية رسمية صادرة آلياً من منصة نظامها التعليمية · جميع الأرقام المحصلة خاضعة لحركات السداد الفعلية
      </div>
    </body>
    </html>`;
  };

  const handlePrintInPlace = async () => {
    try {
      setPrinting(true);
      setPrintError(null);
      const html = generateDocumentHtml();
      await printInPlace({ html });
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "تعذر تشغيل أمر الطباعة.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: "rgba(10, 15, 29, 0.82)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "1rem",
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Sticky Action Toolbar inside the same page */}
      <div
        style={{
          width: "100%",
          maxWidth: "980px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: "0.75rem 1.25rem",
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
          flexWrap: "wrap",
          gap: "0.75rem",
          position: "sticky",
          top: "0.5rem",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(20, 184, 166, 0.15)",
              color: "var(--color-teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Printer size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#ffffff" }}>
              معاينة كشف الحساب والتقرير المالي
            </h3>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8" }}>
              {periodLabel} · {teacherName} · جاهز للطباعة المباشرة في نفس الصفحة
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <button
            onClick={handlePrintInPlace}
            disabled={printing}
            className="btn btn-primary"
            style={{
              padding: "0.45rem 1.15rem",
              borderRadius: 8,
              fontSize: "0.85rem",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              background: "var(--color-teal)",
              borderColor: "var(--color-teal)",
              color: "#ffffff",
              boxShadow: "0 2px 10px rgba(20, 184, 166, 0.35)",
              cursor: printing ? "not-allowed" : "pointer",
            }}
          >
            <Printer size={16} />
            <span>{printing ? "جاري تجهيز الطباعة..." : "طباعة المستند الآن"}</span>
          </button>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: 8,
              fontSize: "0.82rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              color: "#cbd5e1",
              borderColor: "#475569",
              background: "rgba(255, 255, 255, 0.05)",
            }}
          >
            <X size={15} />
            <span>إغلاق</span>
          </button>
        </div>
      </div>

      {printError && (
        <div
          style={{
            width: "100%",
            maxWidth: "980px",
            marginBottom: "1rem",
            padding: "0.65rem 1rem",
            background: "rgba(220, 38, 38, 0.15)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            borderRadius: 8,
            color: "#f87171",
            fontSize: "0.82rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={15} />
          <span>{printError}</span>
        </div>
      )}

      {/* Sheet Preview Container (Rendered exactly in black/white with clean columns) */}
      <div
        style={{
          width: "100%",
          maxWidth: "980px",
          background: "#ffffff",
          color: "#0f172a",
          borderRadius: "8px",
          padding: "2.5rem 2rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
          border: "1px solid #cbd5e1",
          direction: "rtl",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        {/* Document Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: "1rem",
            borderBottom: "2px solid #0f172a",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#0f172a" }}>منصة نظامها — Nazamha</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f766e", marginTop: 2 }}>
              كشف الحساب والتقرير المالي المعتمد
            </div>
            <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: 2, fontWeight: 600 }}>
              الفترة: {periodLabel}
            </div>
          </div>
          <div style={{ textAlign: "left", fontSize: "0.78rem", color: "#475569", lineHeight: 1.6 }}>
            <div>
              <strong>المعلم / الحساب:</strong> {teacherName}
            </div>
            <div>
              <strong>تاريخ الإصدار:</strong> {printDateStr} ({printTimeStr})
            </div>
            <div>
              <strong>إجمالي الطلاب المسجلين:</strong> {totalStudentsCount} طالب
            </div>
          </div>
        </div>

        {/* 6 Structured KPI Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "0.55rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* 1. Collected */}
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderTop: "3px solid #059669",
              borderRadius: 6,
              padding: "0.55rem 0.65rem",
              background: "#ffffff",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>إجمالي المحصل</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#047857", margin: "2px 0" }}>
              {kpis.totalCollected.toLocaleString()} ج.م
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
              اشتراكات: {kpis.subscriptionCollected.toLocaleString()} | كتب: {kpis.bookCollected.toLocaleString()}
            </div>
          </div>

          {/* 2. Due */}
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderTop: "3px solid #0f172a",
              borderRadius: 6,
              padding: "0.55rem 0.65rem",
              background: "#ffffff",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>إجمالي المستحق</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a", margin: "2px 0" }}>
              {kpis.totalDue.toLocaleString()} ج.م
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>للشهور المفعلة للطلاب</div>
          </div>

          {/* 3. Debt */}
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderTop: "3px solid #dc2626",
              borderRadius: 6,
              padding: "0.55rem 0.65rem",
              background: "#ffffff",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>الديون والمتأخرات</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#b91c1c", margin: "2px 0" }}>
              {kpis.outstandingDebt.toLocaleString()} ج.م
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{kpis.unpaidStudentsCount} طالب عليهم ديون</div>
          </div>

          {/* 4. Collection Rate */}
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderTop: "3px solid #0d9488",
              borderRadius: 6,
              padding: "0.55rem 0.65rem",
              background: "#ffffff",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>نسبة التحصيل</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f766e", margin: "2px 0" }}>
              {kpis.collectionRate}%
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
              {kpis.payingStudentsCount} مسددين من {kpis.totalEligibleStudents}
            </div>
          </div>

          {/* 5. Expenses */}
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderTop: "3px solid #475569",
              borderRadius: 6,
              padding: "0.55rem 0.65rem",
              background: "#ffffff",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>إجمالي المصروفات</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#475569", margin: "2px 0" }}>
              {kpis.totalExpenses.toLocaleString()} ج.م
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>فواتير ورواتب ومصروفات</div>
          </div>

          {/* 6. Net Profit */}
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderTop: `3px solid ${kpis.netProfit < 0 ? "#dc2626" : "#059669"}`,
              borderRadius: 6,
              padding: "0.55rem 0.65rem",
              background: "#ffffff",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>صافي الأرباح</div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 900,
                color: kpis.netProfit < 0 ? "#b91c1c" : "#047857",
                margin: "2px 0",
              }}
            >
              {kpis.netProfit.toLocaleString()} ج.م
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>المحصل − المصروفات</div>
          </div>
        </div>

        {/* Section: Monthly Summary Table */}
        {monthlySummary.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontSize: "0.92rem",
                fontWeight: 800,
                color: "#0f172a",
                marginBottom: "0.45rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>■ الملخص المالي للشهور</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                    <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "right" }}>الشهر</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "center" }}>الحالة</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "right" }}>المستحق</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "right" }}>المحصل</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "right" }}>المتبقي</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "center" }}>النسبة</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "center" }}>مسددين</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "center" }}>متعثرين</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "right" }}>صافي الربح</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.map((m) => (
                    <tr
                      key={`${m.year}-${m.month}`}
                      style={{
                        background: m.isCurrentMonth ? "#f0fdfa" : m.isActive ? "#ffffff" : "#f8fafc",
                      }}
                    >
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontWeight: 700 }}>
                        {m.name} {m.year}{" "}
                        {m.isCurrentMonth && (
                          <span style={{ fontSize: "0.68rem", color: "#0f766e" }}>(الحالي)</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          border: "1px solid #cbd5e1",
                          textAlign: "center",
                          color: m.isActive ? "#047857" : "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        {m.isActive ? "مفعّل" : "غير مفعّل"}
                      </td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "right" }}>
                        {m.due.toLocaleString()} ج.م
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          border: "1px solid #cbd5e1",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#047857",
                        }}
                      >
                        {m.collected.toLocaleString()} ج.م
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          border: "1px solid #cbd5e1",
                          textAlign: "right",
                          fontWeight: 700,
                          color: m.remaining > 0 ? "#b91c1c" : "#0f172a",
                        }}
                      >
                        {m.remaining.toLocaleString()} ج.م
                      </td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: 700 }}>
                        {m.collectionRate}%
                      </td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                        {m.payingCount}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          border: "1px solid #cbd5e1",
                          textAlign: "center",
                          color: m.debtCount > 0 ? "#b91c1c" : "#0f172a",
                        }}
                      >
                        {m.debtCount}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          border: "1px solid #cbd5e1",
                          textAlign: "right",
                          color: m.netProfit < 0 ? "#b91c1c" : "#047857",
                          fontWeight: 700,
                        }}
                      >
                        {m.netProfit.toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Two-Column Section: Stages & Groups */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Column A: Stages */}
          <div>
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.45rem" }}>
              ■ إيرادات المراحل الدراسية
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "#1e293b", color: "#ffffff" }}>
                  <th style={{ padding: "6px 8px", border: "1px solid #1e293b", textAlign: "right" }}>المرحلة</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #1e293b", textAlign: "center" }}>الطلاب</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #1e293b", textAlign: "center" }}>سددوا</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #1e293b", textAlign: "right" }}>المحصل</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #1e293b", textAlign: "right" }}>الديون</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #1e293b", textAlign: "center" }}>النسبة</th>
                </tr>
              </thead>
              <tbody>
                {stageRevenue.map((st) => (
                  <tr key={st.id}>
                    <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontWeight: 700 }}>{st.name}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                      {st.totalStudents}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #cbd5e1",
                        textAlign: "center",
                        color: "#047857",
                        fontWeight: 600,
                      }}
                    >
                      {st.paidStudents}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #cbd5e1",
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#047857",
                      }}
                    >
                      {st.totalCollected.toLocaleString()} ج.م
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #cbd5e1",
                        textAlign: "right",
                        fontWeight: 600,
                        color: st.totalOutstanding > 0 ? "#b91c1c" : "#0f172a",
                      }}
                    >
                      {st.totalOutstanding.toLocaleString()} ج.م
                    </td>
                    <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: 700 }}>
                      {st.collectionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Column B: Top Book & Group Highlights */}
          <div>
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.45rem" }}>
              ■ أفضل المجموعات والكتب مبيعاً
            </div>
            {topBook && (
              <div
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "0.6rem 0.8rem",
                  background: "#f8fafc",
                  marginBottom: "0.65rem",
                }}
              >
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>
                  الكتاب الأكثر مبيعاً في الفترة:
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                  {topBook.name}
                </div>
                <div style={{ fontSize: "0.74rem", color: "#0f766e", fontWeight: 700 }}>
                  تم بيع {topBook.count} نسخة · إجمالي مبيعات: {topBook.earnings.toLocaleString()} ج.م
                </div>
              </div>
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "#1e293b", color: "#ffffff" }}>
                  <th style={{ padding: "6px 8px", border: "1px solid #1e293b", textAlign: "right" }}>المجموعة</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #1e293b", textAlign: "right" }}>المرحلة</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #1e293b", textAlign: "right" }}>المحصل</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #1e293b", textAlign: "center" }}>النسبة</th>
                </tr>
              </thead>
              <tbody>
                {groupRevenue.slice(0, 6).map((g) => (
                  <tr key={g.id}>
                    <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontWeight: 700 }}>{g.name}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", color: "#475569" }}>{g.gradeName}</td>
                    <td
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #cbd5e1",
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#047857",
                      }}
                    >
                      {g.totalCollected.toLocaleString()} ج.م
                    </td>
                    <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: 700 }}>
                      {g.collectionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section: Outstanding Debt Summary */}
        {outstandingStudents.length > 0 && (
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#b91c1c", marginBottom: "0.45rem" }}>
              ■ كشف ملخص بالطلاب أصحاب الديون المتأخرة (أول {Math.min(15, outstandingStudents.length)} طالب)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "#b91c1c", color: "#ffffff" }}>
                  <th style={{ padding: "6px 8px", border: "1px solid #b91c1c", textAlign: "right" }}>اسم الطالب</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #b91c1c", textAlign: "center" }}>الكود</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #b91c1c", textAlign: "right" }}>المجموعة</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #b91c1c", textAlign: "right" }}>الشهور المتأخرة</th>
                  <th style={{ padding: "6px 8px", border: "1px solid #b91c1c", textAlign: "right" }}>المتبقي</th>
                </tr>
              </thead>
              <tbody>
                {outstandingStudents.slice(0, 15).map((st) => (
                  <tr key={st.studentId}>
                    <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontWeight: 700 }}>{st.studentName}</td>
                    <td
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #cbd5e1",
                        textAlign: "center",
                        fontFamily: "monospace",
                      }}
                    >
                      {st.studentCode || "—"}
                    </td>
                    <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>{st.groupName}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "0.72rem", color: "#475569" }}>
                      {st.overdueMonths.map((m) => m.label).join("، ") || "—"}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #cbd5e1",
                        textAlign: "right",
                        fontWeight: 800,
                        color: "#b91c1c",
                      }}
                    >
                      {st.remainingBalance.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: "1.75rem",
            fontSize: "0.72rem",
            color: "#64748b",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "0.8rem",
          }}
        >
          وثيقة مالية رسمية صادرة آلياً من منصة نظامها التعليمية · جميع الأرقام المحصلة خاضعة لحركات السداد الفعلية
        </div>
      </div>
    </div>
  );
}
