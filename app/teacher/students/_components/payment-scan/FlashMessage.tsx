"use client";

import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface FlashMsg {
  text: string;
  type: "success" | "error" | "warn";
}

interface Props {
  flashMsg: FlashMsg | null;
  loading: boolean;
  saving?: boolean;
}

const styles = {
  success: "bg-emerald-500/12 border-emerald-500/35 text-emerald-300",
  error:   "bg-red-500/10 border-red-500/30 text-red-400",
  warn:    "bg-amber-500/10 border-amber-500/30 text-amber-400",
};

const icons = {
  success: <CheckCircle2 size={18} />,
  error:   <AlertCircle size={15} />,
  warn:    <Info size={15} />,
};

export function FlashMessage({ flashMsg, loading, saving = false }: Props) {
  if (!flashMsg && !loading) return null;

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-teal-500/8 border border-teal-500/20 text-[var(--text-muted)] text-sm leading-relaxed">
        <span className="inline-block w-4 h-4 rounded-full border-2 border-teal-500/30 border-t-teal-400 animate-spin shrink-0" />
        <span className="leading-relaxed">{saving ? "جاري تسجيل الدفع… انتظر تأكيد النجاح." : "جاري تحميل بيانات الطالب…"}</span>
      </div>
    );
  }

  if (!flashMsg) return null;

  return (
    <div role={flashMsg.type === "error" ? "alert" : "status"} aria-live="polite" className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold ${styles[flashMsg.type]}`}>
      <span className="shrink-0">{icons[flashMsg.type]}</span>
      <span className="break-words leading-relaxed flex-1 min-w-0">{flashMsg.text}</span>
    </div>
  );
}
