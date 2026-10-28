"use client";

import { Check, X, LoaderCircle } from "lucide-react";
import { Student } from "@/lib/types";
import { SessionState } from "./SessionHeaderCell";

export function AttendanceCell({
  present, state, student, dateStr, onToggle, isPastWeek, onShowToast, saving=false, sessionSaving=false,
}: {
  present: boolean; state: SessionState; student: Student; dateStr: string;
  onToggle: (s: Student, d: string) => void; isPastWeek: boolean;
  onShowToast?: (msg: string, type: "error") => void;
  saving?:boolean; sessionSaving?:boolean;
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
  const resolution=student.attendance_resolutions?.[dateStr];
  if(resolution)return <td className="text-center px-1 py-1.5"><span className="text-amber-400 text-xs" title={resolution==="compensated"?"غياب معوّض بحضور حصة أخرى؛ ليس حضورًا فعليًا هنا":"إعفاء معتمد من الغياب؛ ليس حضورًا فعليًا هنا"}>{resolution==="compensated"?"معوّض":"معفى"}</span></td>;
  const isSuspended = student.is_suspended && (!student.suspended_until || new Date(student.suspended_until) > new Date());
  const canEdit = !isPastWeek && !isFuture && !isSuspended && (state === "active" || state === "expired");

  const handleClick = () => {
    if(saving||sessionSaving)return;
    if (isPastWeek) { onShowToast?.("أسبوع منتهي — لا يمكن تعديل غياب أو حضور أسابيع سابقة", "error"); return; }
    if (isFuture) { onShowToast?.("حصة مستقبلية — لا يمكن تسجيل أو تعديل غياب حصة قبل موعدها", "error"); return; }
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
              : isFuture
                ? "border-white/5 bg-white/[0.01] text-transparent opacity-20 cursor-not-allowed"
                : (state === "expired") && !present
                ? "border-red-500/30 bg-red-500/[0.06] text-red-500/50 cursor-pointer hover:border-teal-500/50 hover:bg-teal-500/10"
                : "border-white/10 bg-white/[0.02] text-transparent hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-500/50 cursor-pointer"
          }`}
        onClick={handleClick}
        disabled={!canEdit||saving||sessionSaving}
        aria-busy={saving}
        aria-label={saving?`جاري حفظ حضور ${student.name}`:undefined}
        style={saving?{color:"var(--text-primary, #e2e8f0)"}:undefined}
        title={
          isPastWeek ? "أسبوع منتهي — لا يمكن التعديل" :
          isFuture ? "حصة مستقبلية — لا يمكن التعديل حتى موعد الحصة" :
          present ? `إلغاء حضور ${student.name} (متاح التعديل طوال الأسبوع الحالي)` :
          state === "expired" ? `تسجيل حضور ${student.name} (متاح التعديل طوال الأسبوع الحالي)` :
          `تسجيل حضور ${student.name}`
        }
      >
        {saving?<LoaderCircle size={13} className="animate-spin"/>:present ? <Check size={13} strokeWidth={3} /> : (state === "expired" || isPastWeek) ? <X size={11} strokeWidth={2.5} /> : null}
      </button>
      {saving&&<span role="status" className="block text-[0.6rem] text-slate-400 mt-0.5 whitespace-nowrap">جاري الحفظ</span>}
    </td>
  );
}
