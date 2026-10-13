"use client";

import { Check, X } from "lucide-react";
import { Student } from "@/lib/types";
import { SessionState } from "./SessionHeaderCell";

export function AttendanceCell({
  present, state, student, dateStr, onToggle, isPastWeek, onShowToast,
}: {
  present: boolean; state: SessionState; student: Student; dateStr: string;
  onToggle: (s: Student, d: string) => void; isPastWeek: boolean;
  onShowToast?: (msg: string, type: "error") => void;
}) {
  if (state === "cancelled") {
    return (
      <td className="text-center px-1 py-1.5 bg-red-500/[0.04]">
        <span className="text-slate-500 text-sm opacity-50">—</span>
      </td>
    );
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  const isFuture = dateStr > today;
  const isSuspended = student.is_suspended && (!student.suspended_until || new Date(student.suspended_until) > new Date());
  const canEdit = !isPastWeek && !isFuture && !isSuspended && (state === "active" || state === "expired");

  const handleClick = () => {
    if (isFuture) { onShowToast?.("لا يمكن تسجيل حضور في تاريخ مستقبلي", "error"); return; }
    if (isSuspended) { onShowToast?.("هذا الطالب موقوف — لا يمكن تسجيل حضوره", "error"); return; }
    if (canEdit) onToggle(student, dateStr);
  };

  return (
    <td className="text-center px-1 py-1.5">
      <button
        className={`w-9 h-9 rounded-[9px] border-2 inline-flex items-center justify-center mx-auto transition-all
          ${present
            ? "border-teal-500 bg-teal-500/20 text-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.2)] hover:bg-teal-500/25"
            : isPastWeek
              ? "border-white/10 bg-white/[0.02] text-transparent opacity-30 cursor-not-allowed"
              : (state === "expired") && !present
                ? "border-red-500/30 bg-red-500/[0.06] text-red-500/50 cursor-pointer hover:border-teal-500/50 hover:bg-teal-500/10"
                : "border-white/10 bg-white/[0.02] text-transparent hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-500/50 cursor-pointer"
          }`}
        onClick={handleClick}
        disabled={isPastWeek}
        title={
          isPastWeek ? "أسبوع منتهي — لا يمكن التعديل" :
          isFuture ? "لا يمكن تسجيل حضور في تاريخ مستقبلي" :
          present ? `إلغاء حضور ${student.name}` :
          state === "expired" ? `تسجيل حضور ${student.name}` :
          `تسجيل حضور ${student.name}`
        }
      >
        {present ? <Check size={13} strokeWidth={3} /> : (state === "expired" || isPastWeek) ? <X size={11} strokeWidth={2.5} /> : null}
      </button>
    </td>
  );
}
