"use client";

import { useState } from "react";
import { Student, Group } from "@/lib/types";
import { QrCode, CalendarClock, ChevronDown } from "lucide-react";
import { SessionState, SessionHeaderCell } from "./SessionHeaderCell";
import { AttendanceCell } from "./AttendanceCell";
import { ARABIC_DAYS } from "@/lib/groupUtils";
import { getTodayCairo } from "@/lib/utils/dateUtils";

interface GroupTableProps {
  group: Group | null;
  groupId: string;
  students: Student[];
  sessionDates: string[];
  sessionStates: Record<string, SessionState>;
  activeDates: string[];
  startIndex: number;
  isPastWeek: boolean;
  isSaving: (gid: string, date: string) => boolean;
  isCellSaving?: (sid:string,date:string,gid?:string|null) => boolean;
  isPresent: (sid: string, date: string,groupId?:string|null) => boolean;
  getAttendancePercent: (sid: string, activeDates: string[], joinDate?: string,groupId?:string|null) => number | null;
  onToggle: (student: Student, date: string) => void;
  onMarkAll: (date: string, gid: string) => void;
  onClearSession: (date: string, gid: string) => void;
  onCancelSession: (groupId: string, date: string) => void;
  onShowQR: (student: Student) => void;
  onShowToast: (msg: string, type: "error") => void;
}

export function GroupTable({
  group, groupId, students, sessionDates, sessionStates, activeDates,
  startIndex, isPastWeek, isSaving, isCellSaving,
  isPresent, getAttendancePercent,
  onToggle, onMarkAll, onClearSession, onCancelSession, onShowQR, onShowToast,
}: GroupTableProps) {
  const [collapsed, setCollapsed] = useState(false);

  const days = (group?.day_of_week.split(/\s*[,،]\s*|\s+/).map(d => d.trim()).filter(Boolean) ?? [])
    .sort((a, b) => ARABIC_DAYS.indexOf(a) - ARABIC_DAYS.indexOf(b));

  const today = getTodayCairo();
  const startDate = group?.start_date ?? group?.created_at?.slice(0, 10) ?? null;
  const notStartedYet = startDate ? today < startDate : false;

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className="mb-4">
      {/* Group header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="relative w-full flex items-center justify-between gap-2 px-2.5 sm:px-5 py-3 rounded-t-[10px] border border-teal-500/20 overflow-hidden text-right cursor-pointer transition-all hover:border-teal-500/35"
        style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.10) 0%, rgba(15,23,42,0.95) 60%)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex-shrink-0">
            <span className="text-teal-400 text-[0.85rem] font-black">#</span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-bold text-[0.88rem] sm:text-[0.92rem] text-slate-100 leading-tight truncate">{group?.name ?? "بدون مجموعة"}</span>
            <span className="text-[0.72rem] text-slate-500">{students.length} طالب مسجّل</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {days.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 flex-wrap">
              <span className="text-[0.68rem] text-slate-500 ml-1">أيام الحضور:</span>
              {days.map(d => (
                <span key={d} className="text-[0.7rem] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 whitespace-nowrap tracking-wide">
                  {d}
                </span>
              ))}
            </div>
          )}
          <div className={`flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 text-slate-400 transition-transform duration-200 flex-shrink-0 ${collapsed ? "" : "rotate-180"}`}>
            <ChevronDown size={15} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
      </button>

      {/* Collapsible content */}
      {!collapsed && (
        <>
          {notStartedYet && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-500/[0.07] border-x border-amber-500/20">
              <CalendarClock size={14} className="text-amber-400 shrink-0" />
              <p className="text-[0.78rem] text-amber-300/80">
                هذه المجموعة لم تبدأ بعد — موعد البداية: <span className="font-bold text-amber-400">{formatDate(startDate!)}</span>
              </p>
            </div>
          )}

          {/* Table view */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-right text-[0.82rem] sm:text-[0.88rem]">
              <thead>
                <tr style={{ background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(2,6,23,0.98) 100%)" }}>
                  <th className="w-6 text-center px-1 py-2.5 text-[0.68rem] font-bold text-slate-400 border-b border-teal-500/10 whitespace-nowrap uppercase tracking-widest">#</th>
                  <th className="w-[70px] min-w-[70px] text-center px-1 py-2.5 text-[0.68rem] font-bold text-slate-400 border-b border-teal-500/10 whitespace-nowrap uppercase tracking-widest">الكود</th>
                  <th className="min-w-[100px] px-1.5 py-2.5 text-[0.68rem] font-bold text-slate-400 border-b border-teal-500/10 whitespace-nowrap uppercase tracking-widest">الطالب</th>
                  {sessionDates.map(d => (
                    <SessionHeaderCell
                      key={d}
                      dateStr={d}
                      state={sessionStates[d] ?? "active"}
                      saving={isSaving(groupId, d)}
                      groupId={groupId}
                      isPastWeek={isPastWeek}
                      onMarkAll={onMarkAll}
                      onClearSession={onClearSession}
                      onCancelSession={onCancelSession}
                    />
                  ))}
                  <th className="w-16 text-center px-1.5 py-2.5 text-[0.68rem] font-bold text-slate-400 border-b border-teal-500/10 whitespace-nowrap uppercase tracking-widest">النسبة</th>
                  <th className="w-10 text-center px-1.5 py-2.5 text-[0.68rem] font-bold text-slate-400 border-b border-teal-500/10 whitespace-nowrap uppercase tracking-widest">QR</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => {
                  const joinDate = student.group_join_date || student.created_at?.slice(0, 10);
                  const pct = getAttendancePercent(student.id, activeDates.filter(d=>(!student.attendance_ends_on || d<=student.attendance_ends_on)&&!student.attendance_excluded_dates?.includes(d)), joinDate,student.group_id);
                  const pctColor = pct !== null ? (pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444") : "#94a3b8";
                  return (
                    <tr key={`${student.id}-${student.group_id}-${student.group_join_date}`} className="transition-colors hover:[&>td]:bg-white/[0.02]">
                      <td className="text-center text-slate-500 font-semibold text-[0.78rem] px-1 py-2 border-b border-white/[0.04]">{startIndex + i + 1}</td>
                      <td className="text-center font-mono text-[0.78rem] text-slate-400 whitespace-nowrap px-1 py-2 border-b border-white/[0.04]">{student.code || "—"}</td>
                      <td className="whitespace-nowrap px-1.5 py-2 border-b border-white/[0.04]">
                        <span className="font-semibold text-slate-100 text-[0.82rem]">{student.name}</span>
                      </td>
                      {sessionDates.map(d => {
                        const joinDate = student.group_join_date || student.created_at?.slice(0, 10);
                        const beforeJoin = !!student.attendance_excluded_dates?.includes(d) || (joinDate ? d < joinDate : false) || !!(student.attendance_ends_on && d > student.attendance_ends_on);
                        if (beforeJoin) {
                          return (
                            <td key={d} className="text-center px-1.5 py-2 border-b border-white/[0.04]">
                              <span className="text-amber-400 text-xs font-semibold" title="معفي — قبل تاريخ الانضمام">معفي</span>
                            </td>
                          );
                        }
                        return (
                          <AttendanceCell
                            key={d}
                            present={isPresent(student.id, d,student.group_id)}
                            state={sessionStates[d] ?? "active"}
                            student={student}
                            dateStr={d}
                            onToggle={onToggle}
                            isPastWeek={isPastWeek}
                            saving={!!isCellSaving?.(student.id,d,student.group_id)}
                            sessionSaving={isSaving(groupId,d)}
                            onShowToast={onShowToast}
                          />
                        );
                      })}
                      <td className="text-center px-1.5 py-2 border-b border-white/[0.04]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-bold text-[0.82rem]" style={{ color: pctColor }}>{pct}%</span>
                          <div className="w-9 h-[3px] bg-white/[0.06] rounded-sm overflow-hidden">
                            <div className="h-full rounded-sm transition-all" style={{ width: `${pct}%`, background: pctColor }} />
                          </div>
                        </div>
                      </td>
                      <td className="text-center px-1.5 py-2 border-b border-white/[0.04]">
                        <button
                          className="inline-flex items-center justify-center w-[28px] h-[28px] rounded-lg bg-blue-500/[0.08] border border-blue-500/20 text-blue-400 cursor-pointer transition-all hover:bg-blue-500/20 hover:scale-105"
                          onClick={() => onShowQR(student)}
                          title="عرض QR"
                        >
                          <QrCode size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Collapsed footer */}
      {collapsed && (
        <div className="border border-t-0 border-white/[0.07] rounded-b-[10px] px-4 py-2 bg-[rgba(15,23,42,0.4)] flex items-center gap-2">
          <span className="text-[0.75rem] text-slate-500">{students.length} طالب</span>
          <span className="text-slate-700">·</span>
          <span className="text-[0.75rem] text-slate-500">{sessionDates.length} حصة هذا الأسبوع</span>
        </div>
      )}
    </div>
  );
}
