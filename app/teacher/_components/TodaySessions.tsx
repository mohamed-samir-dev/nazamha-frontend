"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Calendar, QrCode, Users } from "lucide-react";
import { Group, Student } from "@/lib/types";

const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const formatTimeTo12H = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

interface TodaySessionsProps {
  groups: Group[];
  students: Student[];
  hasAttendance: boolean;
  todayArabic: string;
}

export function TodaySessions({ groups: todayGroups, students, hasAttendance, todayArabic }: TodaySessionsProps) {
 const counts=useMemo(()=>{const map=new Map<string,number>();for(const s of students) if(s.group_id)map.set(s.group_id,(map.get(s.group_id)||0)+1);return map;},[students]);
  return (
    <div className="glass-panel p-6">
      <h2 className="flex items-center gap-2 text-[1.1rem] font-semibold mb-5 pb-3 border-b border-white/[0.08]">
        <Calendar size={18} className="text-teal-400" />
        <span>جلسات اليوم — {todayArabic}</span>
        <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-teal-500/10 text-teal-400 text-[0.75rem] font-bold border border-teal-500/20">
          {todayGroups.length}
        </span>
      </h2>

      {todayGroups.length === 0 ? (
        <p className="text-slate-500 text-[0.9rem] text-center py-6">
          لا توجد مجموعات مجدولة اليوم
        </p>
      ) : (
        <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1">
          {todayGroups.map((group, idx) => {
            const count = (group as Group & { student_count?: number }).student_count ?? counts.get(group.id) ?? 0;
            return (
              <div
                key={group.id ?? idx}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.08] transition-all duration-250 hover:bg-teal-500/[0.05] hover:border-teal-500/20"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[0.92rem] text-white">{group.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[0.78rem] text-teal-400 font-mono">{formatTimeTo12H(group.time)}</span>
                    <span className="inline-flex items-center gap-1 text-[0.76rem] text-slate-500">
                      <Users size={12} />
                      {count} طالب
                    </span>
                  </div>
                </div>
                {hasAttendance && (
                  <Link
                    href={`/teacher/attendance/scan?group=${group.id}`}
                    className="btn btn-primary shrink-0 !text-[0.78rem] !py-1.5 !px-3"
                  >
                    <QrCode size={14} />
                    <span>ابدأ الحضور</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
