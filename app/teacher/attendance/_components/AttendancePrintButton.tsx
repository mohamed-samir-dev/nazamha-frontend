"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Printer } from "lucide-react";

interface Props {
  onPrint: () => Promise<void>;
  onError: (message: string) => void;
}

export function AttendancePrintButton({ onPrint, onError }: Props) {
  const pending = useRef(false);
  const [printing, setPrinting] = useState(false);

  async function handlePrint() {
    if (pending.current) return;
    pending.current = true;
    setPrinting(true);
    try {
      await onPrint();
    } catch (error) {
      onError(error instanceof Error ? error.message : "تعذر تجهيز التقرير للطباعة. حاول مرة أخرى.");
    } finally {
      pending.current = false;
      setPrinting(false);
    }
  }

  return (
    <button
      type="button"
      className="inline-flex min-h-[42px] sm:min-h-11 min-w-0 items-center justify-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-sky-400/40 bg-gradient-to-r from-sky-500/20 to-sky-600/15 text-sky-200 text-xs sm:text-[0.88rem] font-semibold cursor-pointer transition-all shadow-[0_4px_12px_rgba(14,165,233,0.15)] hover:from-sky-500/30 hover:to-sky-600/25 hover:border-sky-400/60 hover:-translate-y-px active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:opacity-60 disabled:cursor-wait whitespace-nowrap"
      onClick={handlePrint}
      disabled={printing}
      aria-busy={printing}
      title="طباعة تقرير الشهر للمجموعات المختارة من نفس الصفحة"
    >
      {printing ? <LoaderCircle size={16} className="animate-spin shrink-0" aria-hidden="true" /> : <Printer size={16} className="shrink-0 text-sky-300" aria-hidden="true" />}
      <span>{printing ? "جاري التجهيز…" : <>طباعة<span className="hidden sm:inline"> التقرير</span></>}</span>
    </button>
  );
}
