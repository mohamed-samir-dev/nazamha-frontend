"use client";

import { useMemo } from "react";
import { Student, AttendanceRecord } from "@/lib/types";
import { Users, BookOpen, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

import { getGroupSessionDates, isSessionExpired, sessionTime } from "../_utils/sessionDates";
import { Group } from "@/lib/types";
interface Props {
  groups?: Group[];
  students: Student[];
  monthDates: string[];
  cancelledSessions: Set<string>;
  attendance: AttendanceRecord[];
  selectedMonth: number;
  selectedYear: number;
}

export function AttendanceStats({ students, groups = [], monthDates, cancelledSessions, attendance, selectedMonth, selectedYear }: Props) {


  const rosterGroups=new Set(students.map(s=>s.group_id));
  const slots=groups.filter(g=>rosterGroups.has(g.id)).flatMap(g=>getGroupSessionDates(g,selectedMonth,selectedYear).map(date=>({date,cancelled:g.cancelled_sessions?.includes(date)})));
  const activeDates = slots.length ? slots.filter(s=>!s.cancelled).map(s=>s.date) : monthDates.filter(d => !cancelledSessions.has(d));
  const cancelledCount = slots.length ? slots.filter(s=>s.cancelled).length : monthDates.length - activeDates.length;

  // O(A) build once, O(1) per lookup
  const presentSet = useMemo(() => {
    const set = new Set<string>();
    for (const a of attendance) {
      if (a.status === "present" && a.attendance_kind!=="guest" && a.attendance_kind!=="substitute") set.add(`${a.student_id}|${a.group_id||""}|${a.session_date}`);
    }
    return set;
  }, [attendance]);

  const { avg, below75 } = useMemo(() => {
    const totals=new Map<string,{present:number;total:number}>();
    students.forEach(s => {
      const group = groups.find(g => g.id === s.group_id);
      const joined = s.group_join_date || s.created_at?.slice(0,10) || "";
      const dates = (group ? getGroupSessionDates(group,selectedMonth,selectedYear).filter(d => !group.cancelled_sessions?.includes(d)) : activeDates).filter(d => !s.attendance_excluded_dates?.includes(d) && !s.attendance_resolutions?.[d] && d >= joined && (!s.attendance_ends_on || d <= s.attendance_ends_on) && isSessionExpired(d, group ? sessionTime(group,d) : "23:59"));
      const p = dates.filter(d => (presentSet.has(`${s.id}|${s.group_id||""}|${d}`)||presentSet.has(`${s.id}||${d}`))).length;
      const total=totals.get(s.id)||{present:0,total:0}; totals.set(s.id,{present:total.present+p,total:total.total+dates.length});
    });
    const percents=[...totals.values()].filter(s=>s.total>0).map(s=>Math.round(s.present/s.total*100));
    const avg = percents.length > 0 ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : 0;
    const below75 = percents.filter(p => p < 75).length;
    return { avg, below75 };
  }, [students, activeDates, presentSet, groups, selectedMonth, selectedYear]);

  if (students.length === 0 || monthDates.length === 0) return null;

  const stats = [
    {
      label: "إجمالي الطلاب",
      value: new Set(students.map(s=>s.id)).size,
      icon: <Users size={17} />,
      colorClass: "text-blue-400",
      bgClass: "bg-blue-500/10",
    },
    {
      label: "حصص الشهر",
      value: `${activeDates.length}${cancelledCount > 0 ? ` / ${activeDates.length+cancelledCount}` : ""}`,
      sub: cancelledCount > 0 ? `${cancelledCount} ملغاة` : undefined,
      icon: <BookOpen size={17} />,
      colorClass: cancelledCount > 0 ? "text-amber-400" : "text-teal-400",
      bgClass: cancelledCount > 0 ? "bg-amber-500/10" : "bg-teal-500/10",
    },
    {
      label: "متوسط الحضور",
      value: `${avg}%`,
      icon: avg >= 75 ? <TrendingUp size={17} /> : <TrendingDown size={17} />,
      colorClass: avg >= 75 ? "text-emerald-400" : "text-amber-400",
      bgClass: avg >= 75 ? "bg-emerald-500/10" : "bg-amber-500/10",
    },
    {
      label: "تحت 75%",
      value: below75,
      icon: below75 > 0 ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />,
      colorClass: below75 > 0 ? "text-red-400" : "text-emerald-400",
      bgClass: below75 > 0 ? "bg-red-500/10" : "bg-emerald-500/10",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-slate-500 pr-1 before:content-[''] before:inline-block before:w-[3px] before:h-3 before:rounded-sm before:bg-teal-500 before:flex-shrink-0">
        بيانات شهر {arabicMonths[selectedMonth - 1]} {selectedYear}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-[var(--bg-card)] border border-white/[0.07] rounded-[14px] p-3 sm:p-4 flex items-center gap-3 transition-all relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:border-white/[0.12]">
            <div className={`absolute top-0 right-0 w-[3px] h-full rounded-r-[14px] ${s.bgClass.replace("bg-", "bg-").replace("/10", "")}`}
              style={{ background: s.colorClass.includes("teal") ? "var(--color-teal)" : s.colorClass.includes("blue") ? "#3b82f6" : s.colorClass.includes("amber") ? "#f59e0b" : s.colorClass.includes("emerald") ? "#10b981" : "#ef4444" }}
            />
            <div className={`w-[42px] h-[42px] rounded-[12px] ${s.bgClass} ${s.colorClass} flex items-center justify-center flex-shrink-0`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className={`text-xl sm:text-2xl font-bold font-mono leading-none mb-1 ${s.colorClass}`}>{s.value}</div>
              <div className="text-[0.75rem] sm:text-[0.78rem] text-slate-500">{s.label}</div>
              {s.sub && <div className="text-[0.7rem] sm:text-[0.72rem] text-amber-400 mt-0.5">{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
