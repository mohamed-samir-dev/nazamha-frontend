"use client";
import { Users, BookOpen, CalendarCheck, TrendingUp } from "lucide-react";

interface Props {
  studentsCount: number;
  groupsCount: number;
  sessionsThisMonth: number;
  attendanceRate: number | null;
  loading: boolean;
}

function Card({ icon, label, value, bg, color, border }: {
  icon: React.ReactNode; label: string; value: string;
  bg: string; color: string; border: string;
}) {
  return (
    <div className="glass-panel flex items-center gap-3 p-4 sm:p-5">
      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border ${bg} ${color} ${border}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[0.72rem] sm:text-[0.78rem] text-slate-400 mb-0.5 truncate">{label}</p>
        <p className="text-[1.25rem] sm:text-[1.5rem] font-bold leading-none font-mono text-white">{value}</p>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="glass-panel flex items-center gap-3 p-4 sm:p-5 animate-pulse">
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/[0.05] shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-2.5 w-16 rounded bg-white/[0.05]" />
        <div className="h-6 w-10 rounded bg-white/[0.07]" />
      </div>
    </div>
  );
}

export default function KpiCards({ studentsCount, groupsCount, sessionsThisMonth, attendanceRate, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <Card icon={<Users size={17} />} label="الطلاب" value={studentsCount.toLocaleString("ar-EG")} bg="bg-teal-500/10" color="text-teal-400" border="border-teal-500/25" />
      <Card icon={<BookOpen size={17} />} label="المجموعات" value={groupsCount.toLocaleString("ar-EG")} bg="bg-violet-500/10" color="text-violet-400" border="border-violet-500/25" />
      <Card icon={<CalendarCheck size={17} />} label="حصص الشهر" value={sessionsThisMonth.toLocaleString("ar-EG")} bg="bg-blue-500/10" color="text-blue-400" border="border-blue-500/25" />
      <Card icon={<TrendingUp size={17} />} label="حضور الطلاب" value={attendanceRate !== null ? `${attendanceRate}%` : "—"} bg="bg-amber-500/10" color="text-amber-400" border="border-amber-500/25" />
    </div>
  );
}
