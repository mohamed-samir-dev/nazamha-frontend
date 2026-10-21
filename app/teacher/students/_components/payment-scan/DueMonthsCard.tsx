"use client";

import { X, AlertTriangle, Wallet, CheckCircle2 } from "lucide-react";
import { Student, MonthlySubscription } from "@/lib/types";
import { DueMonth } from "./types";

interface Props {
  student: Student;
  dueMonths: DueMonth[];
  selectedSubs: Set<string>;
  isConfirming: boolean;
  locked?: boolean;
  uncertain?: boolean;
  totalSelected: number;
  resolveAmount: (sub: MonthlySubscription, student: Student) => number;
  onToggle: (id: string) => void;
  onConfirm: () => void;
  onDismiss: () => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export function DueMonthsCard({
  student, dueMonths, selectedSubs, isConfirming,
  totalSelected, resolveAmount, onToggle, onConfirm, onDismiss, cardRef, locked = false, uncertain = false,
}: Props) {
  const oldMonths = dueMonths.filter(d => d.isOld);
  const differentDiscounts = new Set(dueMonths.map(({sub}) => sub.amount > 0 ? Math.round(sub.discount / sub.amount * 10000) : 0)).size > 1;

  return (
    <div ref={cardRef} data-payment-review className="rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-black/20 shadow-[0_0_20px_rgba(245,158,11,0.06)]">

      {/* Header */}
      <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 border-b border-amber-500/15 bg-amber-500/8">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
          <AlertTriangle size={14} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text-primary)] break-words leading-relaxed">{student.name}</p>
          <p className="text-xs">الكود: {student.center_student_code || student.code || "—"}</p>
          <p className="text-[0.7rem] text-amber-400/80 leading-relaxed">
            {dueMonths.length} شهر مستحق
            {oldMonths.length > 0 && ` · ${oldMonths.length} متأخر`}
          </p>
        </div>
        <button
          type="button" aria-label="إلغاء اختيار الطالب" disabled={locked}
          onClick={onDismiss}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-red-500/15 hover:text-red-400 transition-all shrink-0"
        >
          <X size={13} />
        </button>
      </div>

      {/* Late warning strip */}
      {oldMonths.length > 0 && (
        <div className="flex items-start gap-2 px-3 sm:px-4 py-2.5 bg-amber-500/6 border-b border-amber-500/10 text-xs text-amber-400">
          <span className="shrink-0 mt-px">⚠️</span>
          <span className="break-words leading-relaxed flex-1">
            متأخر: <strong>{oldMonths.map(d => d.label).join("، ")}</strong>
          </span>
        </div>
      )}

      {/* Months list */}
      {differentDiscounts && <p role="note" className="px-4 py-3 text-xs leading-relaxed text-amber-300 border-b border-amber-500/15 bg-amber-500/5">الخصم المسجّل مختلف بين الشهور. راجع السعر الأساسي والخصم والصافي قبل تأكيد الدفع.</p>}
      <div className="divide-y divide-white/4">
        {dueMonths.map(d => {
          const net = resolveAmount(d.sub, student);
          const checked = selectedSubs.has(d.sub.id);
          return (
            <label
              key={d.sub.id}
              className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 cursor-pointer transition-colors ${
                checked ? "bg-teal-500/5" : "hover:bg-white/2"
              }`}
            >
              <input
                type="checkbox"
                disabled={locked}
                className="w-4 h-4 accent-teal-500 cursor-pointer shrink-0"
                checked={checked}
                onChange={() => onToggle(d.sub.id)}
              />
              <span className="flex-1 flex flex-col gap-1 text-sm min-w-0">
                <span className="flex items-center gap-1.5 flex-wrap">
                  {d.isOld && (
                    <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-400 whitespace-nowrap shrink-0">
                      متأخر
                    </span>
                  )}
                  <span className={`break-words leading-relaxed ${d.isOld ? "text-amber-300" : "text-[var(--text-primary)]"}`}>
                    {d.label}
                  </span>
                </span>
              </span>
              <div className="text-left shrink-0 flex flex-col items-end">
                <span className="text-sm font-bold text-teal-400 whitespace-nowrap">
                  <span className="text-xs font-normal">الصافي </span>
                  {Number.isFinite(net) ? `${net.toLocaleString("ar-EG")} ج` : "مبلغ غير صحيح"}
                </span>
                <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">الأساسي {d.sub.amount.toLocaleString("ar-EG")} ج</span>
                {d.sub.discount > 0 && (
                  <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                    خصم {d.sub.amount > 0 ? (d.sub.discount / d.sub.amount * 100).toLocaleString("ar-EG", {maximumFractionDigits: 2}) : "٠"}٪ · {d.sub.discount.toLocaleString("ar-EG")} ج
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Footer */}
      <div data-payment-actions className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 px-4 py-3 bg-black/20 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <Wallet size={14} className="text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)]">الإجمالي</span>
          <span className="text-sm font-bold text-teal-400 font-mono">
            {totalSelected.toLocaleString("ar-EG")} ج
          </span>
        </div>
        <button
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_2px_10px_rgba(20,184,166,0.25)] w-full sm:w-auto sm:min-w-fit"
          onClick={onConfirm}
          disabled={selectedSubs.size === 0 || isConfirming}
        >
          {isConfirming
            ? <><Spinner /> جاري الحفظ…</>
            : <><CheckCircle2 size={13} /> {uncertain ? "التحقق وإعادة نفس العملية" : `تأكيد استلام الدفع (${selectedSubs.size})`}</>}
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return <span className="inline-block w-3 h-3 rounded-full border-2 border-white/25 border-t-white animate-spin" />;
}
