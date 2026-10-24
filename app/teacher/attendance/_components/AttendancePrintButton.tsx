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
      className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 px-3 py-2 sm:px-4 rounded-[10px] border border-sky-400/50 bg-sky-500/15 text-sky-100 text-sm font-semibold cursor-pointer transition-colors hover:bg-sky-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:opacity-60 disabled:cursor-wait"
      onClick={handlePrint}
      disabled={printing}
      aria-busy={printing}
      title="طباعة تقرير الشهر للمجموعات المختارة من نفس الصفحة"
    >
      {printing ? <LoaderCircle size={18} className="animate-spin shrink-0" aria-hidden="true" /> : <Printer size={18} className="shrink-0" aria-hidden="true" />}
      <span>{printing ? "جاري التجهيز…" : "طباعة التقرير"}</span>
    </button>
  );
}
