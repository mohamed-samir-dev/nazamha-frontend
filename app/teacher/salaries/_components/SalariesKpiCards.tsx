"use client";

import { Wallet, TrendingDown, Users, Calendar, Receipt } from "lucide-react";
import { ARABIC_MONTHS } from "../_hooks/useSalariesPage";

interface Props {
  viewMode: "salaries" | "expenses";
  filterMonth: number;
  filterYear: number;
  totalMonth: number;
  totalYear: number;
  employeeCount: number;
  filteredCount: number;
}

export function SalariesKpiCards({ viewMode, filterMonth, filterYear, totalMonth, totalYear, employeeCount, filteredCount }: Props) {
  const monthName = ARABIC_MONTHS[filterMonth - 1];
  
  const cards = viewMode === "salaries" ? [
    { label: `رواتب ${monthName}`, value: totalMonth, icon: <Wallet size={20} />, color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)" },
    { label: `إجمالي رواتب ${filterYear}`, value: totalYear, icon: <TrendingDown size={20} />, color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
    { label: "عدد الموظفين", value: employeeCount, icon: <Users size={20} />, color: "var(--color-teal)", bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.25)", isCount: true },
    { label: "سجلات الشهر", value: filteredCount, icon: <Calendar size={20} />, color: "var(--color-amber)", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", isCount: true },
  ] : [
    { label: `مصروفات ${monthName}`, value: totalMonth, icon: <Receipt size={20} />, color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
    { label: `إجمالي مصروفات ${filterYear}`, value: totalYear, icon: <TrendingDown size={20} />, color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
    { label: "سجلات الشهر", value: filteredCount, icon: <Calendar size={20} />, color: "var(--color-amber)", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", isCount: true },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,200px),1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
      {cards.map(card => (
        <div key={card.label} className="glass-panel" style={{ padding: "1.1rem", borderLeft: `3px solid ${card.color}`, background: `linear-gradient(135deg, ${card.bg}, var(--bg-card))` }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: card.bg, border: `1px solid ${card.border}`, color: card.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.6rem" }}>
            {card.icon}
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>{card.label}</p>
          <p className="monospace" style={{ fontSize: "clamp(1.1rem,2.5vw,1.4rem)", fontWeight: 900, color: card.color }}>
            {card.isCount ? card.value : `${card.value.toLocaleString()} ج.م`}
          </p>
        </div>
      ))}
    </div>
  );
}
