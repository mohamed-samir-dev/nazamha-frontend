"use client";

import { FolderOpen, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { GroupReportRow } from "../_hooks/useAttendanceReports";

interface Props {
  rows: GroupReportRow[];
}

export function GroupReportTab({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
        <FolderOpen size={44} className="opacity-30" />
        <p>لا توجد مجموعات في هذا الاختيار</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {rows.map((row) => {
        const pctColor = row.avgPct >= 75 ? "#10b981" : row.avgPct >= 50 ? "#f59e0b" : "#ef4444";
        const pctBg = row.avgPct >= 75 ? "bg-emerald-500/10" : row.avgPct >= 50 ? "bg-amber-500/10" : "bg-red-500/10";
        const pctText = row.avgPct >= 75 ? "text-emerald-400" : row.avgPct >= 50 ? "text-amber-400" : "text-red-400";

        return (
          <div
            key={row.group.id}
            className="bg-[var(--bg-card)] border border-white/[0.07] rounded-[14px] p-4 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform hover:shadow-lg hover:border-white/[0.12] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-[3px] h-full rounded-r-[14px]" style={{ background: pctColor }} />

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-400 text-[0.85rem] font-black">#</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-100 text-[0.9rem] truncate">{row.group.name}</p>
                  <p className="text-[0.72rem] text-slate-500">{row.gradeName}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${pctBg} border border-white/[0.07]`}>
                {row.avgPct >= 75 ? <TrendingUp size={13} style={{ color: pctColor }} /> : <TrendingDown size={13} style={{ color: pctColor }} />}
                <span className={`font-mono font-bold text-[0.82rem] ${pctText}`}>{row.avgPct}%</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-[5px] bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${row.avgPct}%`, background: pctColor }} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-0.5 bg-white/[0.03] rounded-[10px] py-2">
                <span className="text-[1rem] font-bold font-mono text-slate-100">{row.studentCount}</span>
                <span className="text-[0.68rem] text-slate-500">طالب</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 bg-white/[0.03] rounded-[10px] py-2">
                <span className="text-[1rem] font-bold font-mono text-teal-400">{row.totalSessions - row.cancelledSessions}</span>
                <span className="text-[0.68rem] text-slate-500">حصة فعلية</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 bg-white/[0.03] rounded-[10px] py-2">
                {row.below75 > 0 ? (
                  <>
                    <span className="text-[1rem] font-bold font-mono text-red-400">{row.below75}</span>
                    <span className="text-[0.68rem] text-slate-500">تحت 75%</span>
                  </>
                ) : (
                  <>
                    <span className="text-[1rem] font-bold font-mono text-emerald-400">✓</span>
                    <span className="text-[0.68rem] text-slate-500">ممتاز</span>
                  </>
                )}
              </div>
            </div>

            {/* Cancelled sessions warning */}
            {row.cancelledSessions > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/[0.07] border border-amber-500/20 rounded-[8px]">
                <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                <span className="text-[0.72rem] text-amber-300/80">
                  {row.cancelledSessions} حصة ملغاة من أصل {row.totalSessions}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
