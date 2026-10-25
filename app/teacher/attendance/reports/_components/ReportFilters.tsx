"use client";

import { useState } from "react";
import { Grade, Group } from "@/lib/types";
import { SlidersHorizontal, Printer, Loader2 } from "lucide-react";
import { formatTimeTo12H } from "../../_utils/sessionDates";
import { exportAttendanceMonth } from "../../_utils/exportUtils";

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

interface Props {
  grades: Grade[];
  availableGroups: Group[];
  selectedMonth: number;
  selectedYear: number;
  selectedGradeId: string;
  selectedGroupId: string;
  onMonthChange: (v: number) => void;
  onYearChange: (v: number) => void;
  onGradeChange: (v: string) => void;
  onGroupChange: (v: string) => void;
}

const selectCls =
  "w-full px-2.5 py-1.5 bg-slate-900/80 border border-white/10 rounded-[10px] text-slate-100 font-[inherit] text-xs outline-none cursor-pointer transition-all focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(20,184,166,0.15)]";

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ReportFilters({
  grades,
  availableGroups,
  selectedMonth,
  selectedYear,
  selectedGradeId,
  selectedGroupId,
  onMonthChange,
  onYearChange,
  onGradeChange,
  onGroupChange,
}: Props) {
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);
    setPrintError(null);
    try {
      await exportAttendanceMonth(selectedMonth, selectedYear, {
        gradeId: selectedGradeId,
        groupId: selectedGroupId,
      });
    } catch (err: any) {
      setPrintError(err?.message || "تعذر تجهيز تقرير الطباعة.");
      setTimeout(() => setPrintError(null), 5000);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-white/[0.07] rounded-[14px] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-teal-400 flex-shrink-0" />
          <span className="text-[0.82rem] font-bold text-slate-300">فلترة وتحديد التقرير</span>
        </div>

        <button
          onClick={handlePrint}
          disabled={printing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-sm"
          title="طباعة التقرير الشهري للخيارات المحددة"
        >
          {printing ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
          <span>{printing ? "جاري التجهيز..." : "طباعة التقرير"}</span>
        </button>
      </div>

      {printError && (
        <div className="mb-2.5 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          {printError}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Field id="report-filter-month" label="الشهر">
          <select
            id="report-filter-month"
            className={selectCls}
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
          >
            {ARABIC_MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field id="report-filter-year" label="السنة">
          <select
            id="report-filter-year"
            className={selectCls}
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>

        <Field id="report-filter-grade" label="السنة الدراسية">
          <select
            id="report-filter-grade"
            className={selectCls}
            value={selectedGradeId}
            onChange={(e) => {
              onGradeChange(e.target.value);
              onGroupChange("all");
            }}
          >
            <option value="all">كل السنين الدراسية</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>

        <Field id="report-filter-group" label="المجموعة">
          <select
            id="report-filter-group"
            className={selectCls}
            value={selectedGroupId}
            onChange={(e) => onGroupChange(e.target.value)}
          >
            <option value="all">كل المجموعات</option>
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}
