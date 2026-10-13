"use client";

import { Grade, Group } from "@/lib/types";
import { formatTimeTo12H } from "../_utils/sessionDates";
import { Filter } from "lucide-react";

interface Props {
  grades: Grade[];
  groups: Group[];
  selectedGradeId: string;
  selectedGroupId: string;
  onGradeChange: (v: string) => void;
  onGroupChange: (v: string) => void;
}

export function AttendanceFilters({
  grades, groups,
  selectedGradeId, selectedGroupId,
  onGradeChange, onGroupChange,
}: Props) {
  const gradeIdsWithGroups = new Set(groups.map(g => g.grade_id).filter(Boolean));
  const availableGrades = grades.filter(g => gradeIdsWithGroups.has(g.id));
  const filteredGroups = groups.filter(
    g => selectedGradeId === "all" || g.grade_id === selectedGradeId
  );

  return (
    <div className="glass-panel px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="text-slate-500 flex items-center flex-shrink-0">
          <Filter size={15} />
        </div>

        <div className="flex flex-col gap-0.5 flex-1 min-w-[120px]">
          <label className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wide">السنة الدراسية</label>
          <select
            className="px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-lg text-slate-100 font-[inherit] text-sm outline-none cursor-pointer transition-all w-full focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(20,184,166,0.15)]"
            value={selectedGradeId}
            onChange={e => { onGradeChange(e.target.value); onGroupChange("all"); }}
          >
            <option value="all">كل السنين</option>
            {availableGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div className="hidden sm:block w-px h-7 bg-white/10 flex-shrink-0" />

        <div className="flex flex-col gap-0.5 flex-1 min-w-[140px]">
          <label className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wide">المجموعة</label>
          <select
            className="px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-lg text-slate-100 font-[inherit] text-sm outline-none cursor-pointer transition-all w-full focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(20,184,166,0.15)]"
            value={selectedGroupId}
            onChange={e => onGroupChange(e.target.value)}
          >
            <option value="all">كل المجموعات</option>
            {filteredGroups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
