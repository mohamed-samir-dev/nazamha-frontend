"use client";

import { useMemo } from "react";
import Link from "next/link";
import { GraduationCap, Users, Plus } from "lucide-react";
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
  grades,
  groups,
  selectedGradeId,
  selectedGroupId,
  onGradeSelect,
  onGroupSelect,
}: ExamsHeaderProps) {
  const filteredGroups = useMemo(() => {
    return selectedGradeId ? groups.filter((g) => g.grade_id === selectedGradeId) : groups;
  }, [groups, selectedGradeId]);

  return (
    <div className="glass-panel p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-indigo-500/15 border border-teal-500/30 text-teal-400">
          <GraduationCap size={20} />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold m-0 text-[var(--text-primary)]">درجات الامتحانات</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">اختر الصف ثم المجموعة لعرض الامتحانات ورصد الدرجات ومتابعة نتائج الطلاب</p>
        </div>
      </div>

      <div className="h-px bg-[var(--border-color)] opacity-50" />

      {/* Grades selection */}
      {grades.length === 0 ? (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500">
          <span>لم تقم بإضافة صفوف ومجموعات دراسية بعد.</span>
          <Link href="/teacher/groups" className="font-bold underline">
            إضافة مجموعة جديدة
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-[56px]">
            <GraduationCap size={14} className="text-[var(--text-muted)]" />
            <span className="text-xs font-bold text-[var(--text-muted)] whitespace-nowrap">الصف</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {grades.map((grade) => {
              const active = selectedGradeId === grade.id;
              return (
                <button
                  key={grade.id}
                  type="button"
                  onClick={() => onGradeSelect(grade.id)}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap border cursor-pointer ${
                    active
                      ? "bg-teal-500/15 border-teal-500/50 text-teal-400 font-bold shadow-sm shadow-teal-500/10"
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

      {/* Groups selection */}
      {selectedGradeId && (
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap pt-1 border-t border-[var(--border-color)]/30">
          <div className="flex items-center gap-1.5 min-w-[56px]">
            <Users size={14} className="text-[var(--text-muted)]" />
            <span className="text-xs font-bold text-[var(--text-muted)] whitespace-nowrap">المجموعة</span>
          </div>
          {filteredGroups.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>لا توجد مجموعات مسجلة لهذا الصف</span>
              <Link href="/teacher/groups" className="text-teal-400 font-semibold inline-flex items-center gap-1">
                <Plus size={12} /> إضافة مجموعة
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredGroups.map((group) => {
                const active = selectedGroupId === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => onGroupSelect(group.id)}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap border cursor-pointer ${
                      active
                        ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-400 font-bold shadow-sm shadow-indigo-500/10"
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
