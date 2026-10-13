"use client";

import { Users, CheckCircle2, BookOpen, AlertTriangle, FolderOpen } from "lucide-react";

interface StatsGridProps {
  totalStudents: number;
  paidThisMonth: number;
  totalGroups: number;
  totalBooksDelivered: number;
  currentMonthName: string;
  unpaidCount: number;
  onUnpaidClick?: () => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  iconBg: string;
  iconColor: string;
  iconBorder: string;
  sub?: React.ReactNode;
  danger?: boolean;
}

function StatCard({ icon, label, value, iconBg, iconColor, iconBorder, sub, danger }: StatCardProps) {
  return (
    <div className={`glass-panel flex items-center gap-5 p-6 transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] ${danger ? "!border-red-500/20 !bg-red-500/[0.04]" : ""}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor} ${iconBorder} border`}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[0.82rem] text-slate-400 font-medium mb-0.5 truncate">{label}</span>
        <span className={`text-[1.7rem] font-bold leading-none font-mono ${danger ? "text-red-400" : "text-white"}`}>
          {value}
        </span>
        {sub}
      </div>
    </div>
  );
}

export function StatsGrid({ totalStudents, paidThisMonth, totalGroups, totalBooksDelivered, currentMonthName, unpaidCount, onUnpaidClick }: StatsGridProps) {
  const paidPercent  = totalStudents > 0 ? Math.round((paidThisMonth / totalStudents) * 100) : 0;
  const unpaidPercent = totalStudents > 0 ? Math.round((unpaidCount / totalStudents) * 100) : 0;

  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 mb-8">
      <StatCard
        icon={<Users size={22} />}
        label="إجمالي الطلاب"
        value={totalStudents}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-400"
        iconBorder="border-blue-500/25"
      />

      <StatCard
        icon={<CheckCircle2 size={22} />}
        label={`مدفوعو ${currentMonthName}`}
        value={paidThisMonth}
        iconBg="bg-teal-500/10"
        iconColor="text-teal-400"
        iconBorder="border-teal-500/25"
        sub={
          <>
            <div className="w-full h-[3px] bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-teal-400 rounded-full transition-[width] duration-700"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
            <span className="text-[0.73rem] text-slate-500 mt-0.5">{paidPercent}% من الطلاب</span>
          </>
        }
      />

      <StatCard
        icon={<FolderOpen size={22} />}
        label="إجمالي المجموعات"
        value={totalGroups}
        iconBg="bg-violet-500/10"
        iconColor="text-violet-400"
        iconBorder="border-violet-500/25"
      />

      <StatCard
        icon={<BookOpen size={22} />}
        label="نسخ الكتب المسلمة"
        value={totalBooksDelivered}
        iconBg="bg-amber-500/10"
        iconColor="text-amber-400"
        iconBorder="border-amber-500/25"
      />

      <button type="button" onClick={onUnpaidClick} className="text-start w-full rounded-xl focus-visible:outline-2 focus-visible:outline-teal-400" style={{ cursor: onUnpaidClick ? "pointer" : "default" }}>
          <StatCard
            icon={<AlertTriangle size={22} />}
            label={`لم يدفعوا — ${currentMonthName}`}
            value={unpaidCount}
            iconBg="bg-red-500/10"
            iconColor="text-red-400"
            iconBorder="border-red-500/25"
            danger
            sub={<span className="text-[0.73rem] text-red-400/80 mt-0.5">{unpaidPercent}% من الطلاب</span>}
          />
      </button>
    </section>
  );
}
