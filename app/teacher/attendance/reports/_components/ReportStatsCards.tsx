"use client";

import { Users, TrendingUp, TrendingDown, Star } from "lucide-react";

interface Props {
  total: number;
  avgPct: number;
  below75: number;
  perfect: number;
}

export function ReportStatsCards({ total, avgPct, below75, perfect }: Props) {
  const cards = [
    {
      label: "إجمالي الطلاب",
      value: total,
      icon: <Users size={17} />,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      bar: "#3b82f6",
    },
    {
      label: "متوسط الحضور",
      value: `${avgPct}%`,
      icon: avgPct >= 75 ? <TrendingUp size={17} /> : <TrendingDown size={17} />,
      color: avgPct >= 75 ? "text-emerald-400" : "text-amber-400",
      bg: avgPct >= 75 ? "bg-emerald-500/10" : "bg-amber-500/10",
      bar: avgPct >= 75 ? "#10b981" : "#f59e0b",
    },
    {
      label: "تحت 75%",
      value: below75,
      icon: <TrendingDown size={17} />,
      color: below75 > 0 ? "text-red-400" : "text-emerald-400",
      bg: below75 > 0 ? "bg-red-500/10" : "bg-emerald-500/10",
      bar: below75 > 0 ? "#ef4444" : "#10b981",
    },
    {
      label: "حضور مثالي",
      value: perfect,
      icon: <Star size={17} />,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      bar: "#f59e0b",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {cards.map((c, i) => (
        <div
          key={i}
          className="bg-[var(--bg-card)] border border-white/[0.07] rounded-[14px] p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 relative overflow-hidden hover:-translate-y-0.5 transition-transform hover:shadow-lg hover:border-white/[0.12]"
        >
          <div className="absolute top-0 right-0 w-[3px] h-full rounded-r-[14px]" style={{ background: c.bar }} />
          <div className={`w-9 h-9 sm:w-[42px] sm:h-[42px] rounded-[10px] sm:rounded-[12px] ${c.bg} ${c.color} flex items-center justify-center flex-shrink-0`}>
            {c.icon}
          </div>
          <div className="min-w-0">
            <div className={`text-lg sm:text-2xl font-bold font-mono leading-none mb-0.5 ${c.color}`}>{c.value}</div>
            <div className="text-[0.68rem] sm:text-[0.75rem] text-slate-500 leading-tight">{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
