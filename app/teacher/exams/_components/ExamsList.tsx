"use client";

import { QuestionBank } from "@/lib/types";
import { ClipboardList, FileText, Hash, Calendar, ArrowLeft } from "lucide-react";

interface ExamsListProps {
  exams: QuestionBank[];
  onSelectExam: (exam: QuestionBank) => void;
}

export function ExamsList({ exams, onSelectExam }: ExamsListProps) {
  if (exams.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center gap-3 py-14 text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <ClipboardList size={26} className="text-teal-400" />
        </div>
        <p className="m-0 text-[var(--text-muted)] font-semibold">لا يوجد امتحانات لهذه المجموعة</p>
        <p className="m-0 text-[var(--text-muted)] text-sm">أضف امتحانات من صفحة نماذج الامتحانات أولاً</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam) => (
        <div
          key={exam.id}
          onClick={() => onSelectExam(exam)}
          className="group relative flex flex-col gap-4 p-5 rounded-2xl border border-teal-500/15 bg-teal-500/[0.04] cursor-pointer transition-all duration-200 hover:border-teal-500/40 hover:bg-teal-500/[0.08] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/5"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-teal-500/0 via-teal-500/50 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold m-0 text-[var(--text-primary)] leading-snug">
              {exam.exam_title || exam.title}
            </h3>
            <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-teal-500/12 border border-teal-500/25 text-teal-400 transition-colors group-hover:bg-teal-500/20">
              <FileText size={15} />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {exam.subject && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Hash size={12} className="text-teal-400" />
                {exam.subject}
              </span>
            )}
            {exam.exam_date && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Calendar size={12} className="text-amber-400" />
                {exam.exam_date}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-teal-500/10">
            <span className="text-xs font-semibold text-teal-400">رصد الدرجات</span>
            <ArrowLeft size={14} className="text-teal-400 transition-transform group-hover:-translate-x-0.5" />
          </div>
        </div>
      ))}
    </div>
  );
}
