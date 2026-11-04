"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3, LineChart, Calendar } from "lucide-react";
import type { DailyRevenuePoint, MonthlySummaryRow } from "../_types/financialTypes";

interface Props {
  isSingleMonth: boolean;
  dailyPoints: DailyRevenuePoint[];
  monthlySummary: MonthlySummaryRow[];
  periodLabel: string;
}

// Custom Tooltip component with Arabic RTL layout
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: 8,
        padding: "0.65rem 0.85rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        direction: "rtl",
        fontSize: "0.8rem",
      }}
    >
      <p style={{ fontWeight: 700, marginBottom: "0.35rem", color: "var(--text-primary)" }}>{label}</p>
      {payload.map((entry: any, index: number) => (
        <div
          key={`item-${index}`}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            color: entry.color || "var(--text-secondary)",
            margin: "0.15rem 0",
          }}
        >
          <span>{entry.name}:</span>
          <span className="monospace" style={{ fontWeight: 700 }}>
            {Number(entry.value).toLocaleString()} ج.م
          </span>
        </div>
      ))}
    </div>
  );
}

export function DailyRevenueChart({
  isSingleMonth,
  dailyPoints,
  monthlySummary,
  periodLabel,
}: Props) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className="glass-panel"
        style={{
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.25rem",
          color: "var(--text-muted)",
        }}
      >
        <span>جاري تجهيز الرسم البياني…</span>
      </div>
    );
  }

  // Format data depending on period
  const data = isSingleMonth
    ? dailyPoints
    : monthlySummary.filter((m) => m.isActive).map((m) => ({
        day: m.month,
        dateLabel: `${m.name} ${m.year}`,
        subscriptions: m.due - m.remaining,
        books: Math.max(0, m.collected - (m.due - m.remaining)),
        total: m.collected,
        expenses: m.expenses,
      }));

  const totalPeriodRevenue = data.reduce((acc, curr: any) => acc + (curr.total || 0), 0);

  return (
    <div
      className="glass-panel"
      style={{
        padding: "1.25rem",
        marginBottom: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(20, 184, 166, 0.12)",
              color: "var(--color-teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BarChart3 size={17} />
          </div>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
              {isSingleMonth ? "التحليل اليومي للإيرادات المحصلة" : "التوزيع المالي عبر شهور السنة الأكاديمية"}
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, marginTop: 2 }}>
              {periodLabel} · إجمالي المحصل: {totalPeriodRevenue.toLocaleString()} ج.م
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.05)",
            padding: "2px",
            borderRadius: 8,
            border: "1px solid var(--border-color)",
          }}
        >
          <button
            onClick={() => setChartType("area")}
            style={{
              all: "unset",
              cursor: "pointer",
              padding: "0.25rem 0.6rem",
              borderRadius: 6,
              fontSize: "0.76rem",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              background: chartType === "area" ? "rgba(20, 184, 166, 0.2)" : "transparent",
              color: chartType === "area" ? "var(--color-teal)" : "var(--text-muted)",
              fontWeight: chartType === "area" ? 700 : 500,
            }}
          >
            <LineChart size={13} />
            <span>مساحي</span>
          </button>
          <button
            onClick={() => setChartType("bar")}
            style={{
              all: "unset",
              cursor: "pointer",
              padding: "0.25rem 0.6rem",
              borderRadius: 6,
              fontSize: "0.76rem",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              background: chartType === "bar" ? "rgba(20, 184, 166, 0.2)" : "transparent",
              color: chartType === "bar" ? "var(--color-teal)" : "var(--text-muted)",
              fontWeight: chartType === "bar" ? 700 : 500,
            }}
          >
            <BarChart3 size={13} />
            <span>أعمدة</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: "100%", height: 260, direction: "ltr" }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorBooks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                dataKey="dateLabel"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                interval={isSingleMonth ? (data.length > 20 ? 2 : 1) : 0}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: "0.78rem" }}
              />
              <Area
                type="monotone"
                dataKey="subscriptions"
                name="إيرادات الاشتراكات"
                stroke="#14b8a6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSubs)"
              />
              <Area
                type="monotone"
                dataKey="books"
                name="مبيعات الكتب"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBooks)"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                dataKey="dateLabel"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                interval={isSingleMonth ? (data.length > 20 ? 2 : 1) : 0}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: "0.78rem" }}
              />
              <Bar dataKey="subscriptions" name="إيرادات الاشتراكات" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="books" name="مبيعات الكتب" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
