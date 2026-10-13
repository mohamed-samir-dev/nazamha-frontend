"use client";

import { Grade, Group } from "@/lib/types";
import { SlidersHorizontal } from "lucide-react";
import { formatTimeTo12H } from "../../_utils/sessionDates";

const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

export function ReportFilters({
  grades, availableGroups,
  selectedMonth, selectedYear, selectedGradeId, selectedGroupId,
  onMonthChange, onYearChange, onGradeChange, onGroupChange,
}: Props) {
  return (
    <div className="bg-[var(--bg-card)] border border-white/[0.07] rounded-[14px] p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={14} className="text-teal-400 flex-shrink-0" />
        <span className="text-[0.78rem] font-semibold text-slate-400">فلترة التقرير</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field label="الشهر">
          <select className={selectCls} value={selectedMonth} onChange={(e) => onMonthChange(Number(e.target.value))}>
            {ARABIC_MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="السنة">
          <select className={selectCls} value={selectedYear} onChange={(e) => onYearChange(Number(e.target.value))}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>

        <Field label="السنة الدراسية">
          <select className={selectCls} value={selectedGradeId} onChange={(e) => { onGradeChange(e.target.value); onGroupChange("all"); }}>
            <option value="all">كل السنين</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Field>

        <Field label="المجموعة">
          <select className={selectCls} value={selectedGroupId} onChange={(e) => onGroupChange(e.target.value)}>
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
