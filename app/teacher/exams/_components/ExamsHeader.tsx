"use client";

import { GraduationCap, Users } from "lucide-react";
import { Grade, Group } from "@/lib/types";

interface ExamsHeaderProps {
  grades: Grade[];
  groups: Group[];
  selectedGradeId: string;
  selectedGroupId: string;
  onGradeSelect: (id: string) => void;
  onGroupSelect: (id: string) => void;
}

export function ExamsHeader({
  grades, groups, selectedGradeId, selectedGroupId, onGradeSelect, onGroupSelect,
}: ExamsHeaderProps) {
  const filteredGroups = selectedGradeId
    ? groups.filter((g) => g.grade_id === selectedGradeId)
    : groups;

  return (
    <div className="glass-panel p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-indigo-500/15 border border-teal-500/30 text-teal-400">
          <GraduationCap size={20} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold m-0 text-[var(--text-primary)]">درجات الامتحانات</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">اختر الصف ثم المجموعة لعرض الامتحانات ورصد الدرجات</p>
        </div>
      </div>

      <div className="h-px bg-[var(--border-color)] opacity-50" />

      {/* Grades */}
      {grades.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-[56px]">
            <GraduationCap size={13} className="text-[var(--text-muted)]" />
            <span className="text-xs font-bold text-[var(--text-muted)] whitespace-nowrap">الصف</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {grades.map((grade) => {
              const active = selectedGradeId === grade.id;
              return (
                <button
                  key={grade.id}
                  onClick={() => onGradeSelect(grade.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap border ${
                    active
                      ? "bg-teal-500/15 border-teal-500/50 text-teal-400 font-bold"
                      : "bg-white/[0.03] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-teal-500/30 hover:text-teal-400"
                  }`}
                >
                  {grade.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Groups */}
      {selectedGradeId && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-[56px]">
            <Users size={13} className="text-[var(--text-muted)]" />
            <span className="text-xs font-bold text-[var(--text-muted)] whitespace-nowrap">المجموعة</span>
          </div>
          {filteredGroups.length === 0 ? (
            <span className="text-xs text-[var(--text-muted)]">لا توجد مجموعات لهذا الصف</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredGroups.map((group) => {
                const active = selectedGroupId === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => onGroupSelect(group.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap border ${
                      active
                        ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-400 font-bold"
                        : "bg-white/[0.03] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-indigo-500/30 hover:text-indigo-400"
                    }`}
                  >
                    {group.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
