"use client";

import { Ban, RotateCcw, CheckSquare, XSquare, Clock, CalendarX, LoaderCircle } from "lucide-react";
import { formatDateShort } from "../_utils/sessionDates";

export type SessionState = "future" | "expired" | "active" | "cancelled";

export function SessionHeaderCell({
  dateStr, state, saving, groupId, isPastWeek,
  onMarkAll, onClearSession, onCancelSession,
}: {
  dateStr: string; state: SessionState; saving: boolean; groupId: string | null; isPastWeek: boolean;
  onMarkAll: (d: string, gid: string) => void; onClearSession: (d: string, gid: string) => void;
  onCancelSession: (gid: string, d: string) => void;
}) {
  const isFuture = state === "future" || dateStr > new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  const canEdit = !isPastWeek && !isFuture && (state === "active" || state === "expired");
  const short = formatDateShort(dateStr);

  const stateStyles: Record<SessionState, string> = {
    active: "border-teal-500 text-teal-400",
    expired: "border-amber-500 text-amber-400",
    future: "border-slate-500 text-slate-400",
    cancelled: "border-red-500 text-red-400",
  };

  return (
    <th className={`text-center min-w-[100px] px-1.5 py-2 att-session-${state}`}>
      <div className="flex flex-col items-center gap-1.5">
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[0.72rem] font-mono font-bold bg-white/[0.03] whitespace-nowrap ${stateStyles[state]}`}>
          {state === "expired" && <Clock size={10} />}
          {state === "cancelled" && <Ban size={10} />}
          {state === "active" && <span className="w-[5px] h-[5px] rounded-full bg-teal-500 flex-shrink-0" />}
          {state === "future" && <span className="w-[5px] h-[5px] rounded-full bg-slate-500 flex-shrink-0" />}
          <span>{short}</span>
        </div>

        {state === "cancelled" && (
          <span className="text-[0.6rem] font-bold px-1.5 py-px rounded bg-red-500/10 border border-red-500/25 text-red-400 tracking-wide">ملغاة</span>
        )}
        {state === "expired" && (
          <span className="text-[0.6rem] font-bold px-1.5 py-px rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 tracking-wide">منتهية</span>
        )}
        {state === "future" && (
          <span className="text-[0.6rem] font-bold px-1.5 py-px rounded bg-slate-500/10 border border-slate-500/15 text-slate-400 tracking-wide">قادمة</span>
        )}

        <div className="flex flex-row gap-0.5 items-center">
          {state !== "cancelled" && (
            <>
              <button
                className="flex items-center justify-center w-[26px] h-[22px] rounded-[5px] border border-teal-500/40 text-teal-400 bg-teal-500/10 cursor-pointer transition-all hover:bg-teal-500/20 hover:border-teal-400 disabled:opacity-20 disabled:cursor-not-allowed"
                onClick={() => onMarkAll(dateStr, groupId ?? "")}
                disabled={saving || !canEdit}
                title={isPastWeek ? "أسبوع منتهي" : isFuture ? "حصة قادمة — لا يمكن التحضير" : "تحضير الكل"}
              >
                <CheckSquare size={12} />
              </button>
              <button
                className="flex items-center justify-center w-[26px] h-[22px] rounded-[5px] border border-red-500/40 text-red-400 bg-red-500/10 cursor-pointer transition-all hover:bg-red-500/20 hover:border-red-400 disabled:opacity-20 disabled:cursor-not-allowed"
                onClick={() => onClearSession(dateStr, groupId ?? "")}
                disabled={saving || !canEdit}
                title={isPastWeek ? "أسبوع منتهي" : isFuture ? "حصة قادمة — لا يمكن الإلغاء" : "إلغاء الكل"}
              >
                <XSquare size={12} />
              </button>
            </>
          )}
          {groupId && !isPastWeek && (
            <button
              className={`flex items-center justify-center w-[26px] h-[22px] rounded-[5px] border cursor-pointer transition-all ${
                state === "cancelled"
                  ? "border-teal-500/40 text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 hover:border-teal-400"
                  : "border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:border-red-400"
              }`}
              onClick={() => onCancelSession(groupId, dateStr)}
              disabled={saving}
              title={state === "cancelled" ? "استعادة الحصة" : "إلغاء الحصة"}
            >
              {state === "cancelled" ? <RotateCcw size={12} /> : <CalendarX size={12} />}
            </button>
          )}
        </div>
        {saving&&<span role="status" className="inline-flex items-center gap-1 text-[0.6rem] text-slate-400"><LoaderCircle size={10} className="animate-spin"/>جاري الحفظ</span>}
      </div>
    </th>
  );
}
