"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { PaidEntry } from "./types";

interface Props {
  paidList: PaidEntry[];
}

export function PaidList({ paidList }: Props) {
  if (paidList.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-black/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-color)] bg-emerald-500/5">
        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
        <span className="text-xs font-semibold text-[var(--text-secondary)] flex-1">تم تسجيل دفعهم</span>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/20 text-emerald-400">
          {paidList.length}
        </span>
      </div>

      {/* Rows */}
      <div className="max-h-56 overflow-y-auto divide-y divide-white/4">
        {paidList.map((e, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/2 transition-colors">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-sm text-[var(--text-primary)] flex-1 break-words">{e.name}</span>
            <span className="text-xs font-bold text-teal-400 font-mono shrink-0">
              {e.amount > 0 ? `${e.amount.toLocaleString("ar-EG")} ج` : "—"}
            </span>
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] font-mono shrink-0">
              <Clock size={10} />
              {e.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
