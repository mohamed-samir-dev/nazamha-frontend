"use client";

import {
  DollarSign,
  TrendingUp,
  Receipt,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
  Percent,
  CheckCircle2,
} from "lucide-react";
import type { FinancialKPIs } from "../_types/financialTypes";

interface Props {
  kpis?: FinancialKPIs;
  totalNetProfit?: number;
  totalGrossEarnings?: number;
  totalExpenses?: number;
  totalBookEarnings?: number;
  currentMonthNetProfit?: number;
  currentMonthGrossEarnings?: number;
  currentMonthExpenses?: number;
  currentMonthBookEarnings?: number;
  prevMonthNetProfit?: number;
  prevMonthGrossEarnings?: number;
  prevMonthExpenses?: number;
  prevMonthBookEarnings?: number;
  currentMonthName?: string;
  periodLabel?: string;
}

function TrendBadge({ current, prev, monthName }: { current?: number; prev?: number; monthName?: string }) {
  if (current === undefined || prev === undefined || (prev === 0 && current === 0)) return null;
  const diff = prev === 0 ? 100 : Math.round(((current - prev) / Math.abs(prev || 1)) * 100);
  if (diff === 0) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          background: "rgba(255,255,255,0.05)",
          padding: "2px 8px",
          borderRadius: "999px",
        }}
      >
        <Minus size={11} /> لا تغيير
      </span>
    );
  }
  const up = diff > 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        fontSize: "0.72rem",
        color: up ? "#10b981" : "#f87171",
        background: up ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${up ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
        padding: "2px 8px",
        borderRadius: "999px",
        fontFamily: "'JetBrains Mono', monospace",
      }}
      title={`مقارنة أداء ${monthName || "الشهر الحالي"} بالشهر السابق`}
    >
      {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(diff)}% مقارنة بالسابق
    </span>
  );
}

export function ReportsSummaryCards({
  kpis,
  totalNetProfit = 0,
  totalGrossEarnings = 0,
  totalExpenses = 0,
  totalBookEarnings = 0,
  currentMonthNetProfit,
  currentMonthGrossEarnings,
  currentMonthExpenses,
  currentMonthBookEarnings,
  prevMonthNetProfit,
  prevMonthGrossEarnings,
  prevMonthExpenses,
  prevMonthBookEarnings,
  currentMonthName,
  periodLabel,
}: Props) {
  // If enhanced kpis object is provided:
  if (kpis) {
    const isNetNegative = kpis.netProfit < 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.25rem" }}>
        {/* Primary 4 Financial KPIs Required */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
            gap: "1rem",
          }}
        >
          {/* 1. Total Collected Revenue */}
          <div
            className="glass-panel"
            style={{
              padding: "1.25rem",
              borderRight: "4px solid var(--color-teal)",
              background: "linear-gradient(135deg, rgba(20,184,166,0.08), var(--bg-card))",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "10px",
                  background: "rgba(20,184,166,0.12)",
                  color: "var(--color-teal)",
                  border: "1px solid rgba(20,184,166,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={20} />
              </div>
              <TrendBadge
                current={kpis.totalCollected}
                prev={prevMonthGrossEarnings}
                monthName={currentMonthName}
              />
            </div>

            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                إجمالي الإيرادات المحصلة
              </p>
              <p
                className="monospace"
                style={{
                  fontSize: "clamp(1.35rem, 2.5vw, 1.85rem)",
                  fontWeight: 900,
                  color: "var(--color-teal)",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {kpis.totalCollected.toLocaleString()}{" "}
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>ج.م</span>
              </p>
            </div>

            <div
              style={{
                fontSize: "0.74rem",
                color: "var(--text-muted)",
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                paddingTop: "0.4rem",
              }}
            >
              <span>اشتراكات: {kpis.subscriptionCollected.toLocaleString()} ج.م</span>
              <span>كتب: {kpis.bookCollected.toLocaleString()} ج.م</span>
            </div>
          </div>

          {/* 2. Total Due Amount */}
          <div
            className="glass-panel"
            style={{
              padding: "1.25rem",
              borderRight: "4px solid #60a5fa",
              background: "linear-gradient(135deg, rgba(96,165,250,0.08), var(--bg-card))",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "10px",
                  background: "rgba(96,165,250,0.12)",
                  color: "#60a5fa",
                  border: "1px solid rgba(96,165,250,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DollarSign size={20} />
              </div>
              {!kpis.isMonthActive && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "rgba(245,158,11,0.15)",
                    color: "var(--color-amber)",
                    border: "1px solid rgba(245,158,11,0.25)",
                  }}
                >
                  غير مفعّل
                </span>
              )}
            </div>

            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                إجمالي المبالغ المستحقة
              </p>
              <p
                className="monospace"
                style={{
                  fontSize: "clamp(1.35rem, 2.5vw, 1.85rem)",
                  fontWeight: 900,
                  color: "#60a5fa",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {kpis.totalDue.toLocaleString()}{" "}
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>ج.م</span>
              </p>
            </div>

            <div
              style={{
                fontSize: "0.74rem",
                color: "var(--text-muted)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                paddingTop: "0.4rem",
              }}
            >
              <span>
                {kpis.isMonthActive
                  ? `الالتزامات المطلوبة لـ ${kpis.totalEligibleStudents} طالب مؤهل`
                  : "شهر غير مفعّل بالسنة الأكاديمية"}
              </span>
            </div>
          </div>

          {/* 3. Outstanding Overdue Debt */}
          <div
            className="glass-panel"
            style={{
              padding: "1.25rem",
              borderRight: `4px solid ${kpis.outstandingDebt > 0 ? "#f87171" : "#10b981"}`,
              background: `linear-gradient(135deg, ${kpis.outstandingDebt > 0 ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)"}, var(--bg-card))`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "10px",
                  background: kpis.outstandingDebt > 0 ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                  color: kpis.outstandingDebt > 0 ? "#f87171" : "#10b981",
                  border: `1px solid ${kpis.outstandingDebt > 0 ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {kpis.outstandingDebt > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: kpis.outstandingDebt > 0 ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                  color: kpis.outstandingDebt > 0 ? "#f87171" : "#10b981",
                  border: `1px solid ${kpis.outstandingDebt > 0 ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                }}
              >
                {kpis.unpaidStudentsCount} طالب
              </span>
            </div>

            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                المتأخرات غير المسددة
              </p>
              <p
                className="monospace"
                style={{
                  fontSize: "clamp(1.35rem, 2.5vw, 1.85rem)",
                  fontWeight: 900,
                  color: kpis.outstandingDebt > 0 ? "#f87171" : "#10b981",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {kpis.outstandingDebt.toLocaleString()}{" "}
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>ج.م</span>
              </p>
            </div>

            <div
              style={{
                fontSize: "0.74rem",
                color: "var(--text-muted)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                paddingTop: "0.4rem",
              }}
            >
              <span>
                {kpis.outstandingDebt > 0
                  ? "مستحقات حلّ موعدها ولم تُسدد بعد"
                  : "رائع! لا توجد متأخرات مستحقة"}
              </span>
            </div>
          </div>

          {/* 4. Collection Rate */}
          <div
            className="glass-panel"
            style={{
              padding: "1.25rem",
              borderRight: "4px solid #a855f7",
              background: "linear-gradient(135deg, rgba(168,85,247,0.08), var(--bg-card))",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "10px",
                  background: "rgba(168,85,247,0.12)",
                  color: "#a855f7",
                  border: "1px solid rgba(168,85,247,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Percent size={20} />
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "#a855f7",
                  fontWeight: 600,
                }}
              >
                محسوبة بالمبالغ
              </span>
            </div>

            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                نسبة التحصيل
              </p>
              <p
                className="monospace"
                style={{
                  fontSize: "clamp(1.35rem, 2.5vw, 1.85rem)",
                  fontWeight: 900,
                  color: "#a855f7",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {kpis.collectionRate}%
              </p>
            </div>

            {/* Visual Progress Bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div
                style={{
                  height: "6px",
                  borderRadius: "3px",
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: "3px",
                    background: "linear-gradient(90deg, #a855f7, #c084fc)",
                    width: `${Math.min(100, Math.max(0, kpis.collectionRate))}%`,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>{kpis.payingStudentsCount} طالب سددوا</span>
                <span>من إجمالي {kpis.totalEligibleStudents}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Financial Summary Strip: Net Profit & Expenses & Books */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "0.75rem",
          }}
        >
          {/* Net Profit */}
          <div
            className="glass-panel"
            style={{
              padding: "0.85rem 1.15rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: `1px solid ${isNetNegative ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
              background: isNetNegative ? "rgba(239,68,68,0.04)" : "rgba(16,185,129,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: 8,
                  background: isNetNegative ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                  color: isNetNegative ? "#ef4444" : "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DollarSign size={16} />
              </div>
              <div>
                <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: 0 }}>صافي الربح للفترة</p>
                <p
                  className="monospace"
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: isNetNegative ? "#ef4444" : "#10b981",
                    margin: 0,
                  }}
                >
                  {kpis.netProfit.toLocaleString()} ج.م
                </p>
              </div>
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>الإيرادات − المصروفات</span>
          </div>

          {/* Expenses */}
          <div
            className="glass-panel"
            style={{
              padding: "0.85rem 1.15rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.12)",
                  color: "#f87171",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Receipt size={16} />
              </div>
              <div>
                <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: 0 }}>إجمالي المصروفات</p>
                <p className="monospace" style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f87171", margin: 0 }}>
                  {kpis.totalExpenses.toLocaleString()} ج.م
                </p>
              </div>
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>فواتير + رواتب + مصروفات</span>
          </div>

          {/* Book Sales Revenue */}
          <div
            className="glass-panel"
            style={{
              padding: "0.85rem 1.15rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid rgba(245,158,11,0.2)",
              background: "rgba(245,158,11,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: 8,
                  background: "rgba(245,158,11,0.12)",
                  color: "var(--color-amber)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen size={16} />
              </div>
              <div>
                <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: 0 }}>إيرادات مبيعات الكتب</p>
                <p className="monospace" style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-amber)", margin: 0 }}>
                  {kpis.bookCollected.toLocaleString()} ج.م
                </p>
              </div>
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>مبيعات مسجلة</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to legacy cards if kpis not passed:
  const netProfitNegative = Number(totalNetProfit) < 0;
  const cards = [
    {
      label: "صافي الأرباح (السنوي)",
      value: totalNetProfit,
      curMonthVal: currentMonthNetProfit,
      prevMonthVal: prevMonthNetProfit,
      icon: <DollarSign size={22} />,
      color: netProfitNegative ? "#ef4444" : "#10b981",
      bg: netProfitNegative ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
      border: netProfitNegative ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
      glow: netProfitNegative ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
      colSpan: true,
    },
    {
      label: "إجمالي الإيرادات (السنوي)",
      value: totalGrossEarnings,
      curMonthVal: currentMonthGrossEarnings,
      prevMonthVal: prevMonthGrossEarnings,
      icon: <TrendingUp size={22} />,
      color: "var(--color-teal)",
      bg: "rgba(20,184,166,0.12)",
      border: "rgba(20,184,166,0.25)",
      glow: "rgba(20,184,166,0.08)",
      colSpan: false,
    },
    {
      label: "إجمالي المصروفات (السنوي)",
      value: totalExpenses,
      curMonthVal: currentMonthExpenses,
      prevMonthVal: prevMonthExpenses,
      icon: <Receipt size={22} />,
      color: "#f87171",
      bg: "rgba(239,68,68,0.12)",
      border: "rgba(239,68,68,0.25)",
      glow: "rgba(239,68,68,0.08)",
      colSpan: false,
    },
    {
      label: "أرباح مبيعات الكتب (السنوي)",
      value: totalBookEarnings,
      curMonthVal: currentMonthBookEarnings,
      prevMonthVal: prevMonthBookEarnings,
      icon: <BookOpen size={22} />,
      color: "var(--color-amber)",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.25)",
      glow: "rgba(245,158,11,0.08)",
      colSpan: false,
    },
  ];

  return (
    <div className="reports-kpi-grid">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`glass-panel${card.colSpan ? " kpi-main-card" : ""}`}
          style={{
            padding: "1.25rem",
            borderLeft: `3px solid ${card.color}`,
            background: `linear-gradient(135deg, ${card.glow}, var(--bg-card))`,
            display: "flex",
            flexDirection: "column",
            gap: "0.875rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "10px",
                background: card.bg,
                color: card.color,
                border: `1px solid ${card.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <TrendBadge current={card.curMonthVal} prev={card.prevMonthVal} monthName={currentMonthName} />
          </div>

          <div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
              {card.label}
            </p>
            <p
              className="monospace"
              style={{
                fontSize: card.colSpan ? "clamp(1.4rem, 3vw, 2rem)" : "clamp(1.1rem, 2.5vw, 1.5rem)",
                fontWeight: 900,
                color: Number(card.value) < 0 ? "#ef4444" : card.color,
                lineHeight: 1,
              }}
            >
              {card.value.toLocaleString()}{" "}
              <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--text-muted)" }}>ج.م</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
