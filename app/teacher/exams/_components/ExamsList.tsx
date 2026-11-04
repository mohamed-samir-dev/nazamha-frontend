"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { QuestionBank } from "@/lib/types";
import { ClipboardList, FileText, Hash, Calendar, ArrowLeft, Plus, Search } from "lucide-react";

interface ExamsListProps {
  exams: QuestionBank[];
  onSelectExam: (exam: QuestionBank) => void;
  loadingExamId?: string | null;
}

export function ExamsList({ exams, onSelectExam, loadingExamId }: ExamsListProps) {
  const [search, setSearch] = useState("");

  const filteredExams = useMemo(() => {
    if (!search.trim()) return exams;
    const q = search.trim().toLowerCase();
    return exams.filter((e) => {
      const title = (e.exam_title || e.title || "").toLowerCase();
      const subject = (e.subject || "").toLowerCase();
      return title.includes(q) || subject.includes(q);
    });
  }, [exams, search]);

  if (exams.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center gap-3 py-14 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <ClipboardList size={26} className="text-teal-400" />
        </div>
        <p className="m-0 text-[var(--text-primary)] font-bold text-base">لا توجد امتحانات مخصصة لهذه المجموعة</p>
        <p className="m-0 text-[var(--text-muted)] text-xs sm:text-sm max-w-md">
          يمكنك إنشاء نموذج امتحان جديد وتخصيصه لهذه المجموعة أو لجميع المجموعات من صفحة نماذج الامتحانات
        </p>
        <Link
          href="/teacher/exams/generator"
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-teal-500/20 no-underline"
        >
          <Plus size={16} />
          إنشاء امتحان جديد في النماذج
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top action row: Exam count, Search, and Generator link */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
          <div className="relative w-full">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="بحث في الامتحانات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:border-teal-500/50"
            />
          </div>
        </div>

        <Link
          href="/teacher/exams/generator"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-semibold text-xs transition-colors no-underline"
        >
          <Plus size={14} />
          <span>امتحان جديد</span>
        </Link>
      </div>

      {filteredExams.length === 0 ? (
        <div className="glass-panel p-8 text-center text-xs text-[var(--text-muted)]">
          لا توجد امتحانات مطابقة لكلمة البحث &quot;{search}&quot;
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => {
            const isLoadingThis = loadingExamId === exam.id;
            const title = exam.exam_title || exam.title;

            return (
              <div
                key={exam.id}
                role="button"
                tabIndex={0}
                aria-label={`فتح امتحان ${title}`}
                onClick={() => onSelectExam(exam)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectExam(exam);
                  }
                }}
                className={`group relative flex flex-col gap-3.5 p-4 sm:p-5 rounded-2xl border border-teal-500/15 bg-teal-500/[0.04] cursor-pointer transition-all duration-200 hover:border-teal-500/40 hover:bg-teal-500/[0.08] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/5 ${
                  isLoadingThis ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-teal-500/0 via-teal-500/50 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm sm:text-base font-bold m-0 text-[var(--text-primary)] leading-snug">
                    {title}
                  </h3>
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-teal-500/12 border border-teal-500/25 text-teal-400 transition-colors group-hover:bg-teal-500/20">
                    <FileText size={15} />
                  </div>
                </div>

                <div className="flex gap-2.5 flex-wrap">
                  {exam.total_score && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      الدرجة: {exam.total_score}
                    </span>
                  )}
                  {exam.subject && (
                    <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                      <Hash size={12} className="text-teal-400" />
                      {exam.subject}
                    </span>
                  )}
                  {exam.exam_date && (
                    <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                      <Calendar size={12} className="text-amber-500 dark:text-amber-400" />
                      {exam.exam_date}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-teal-500/10 mt-auto">
                  <span className="text-xs font-semibold text-teal-500 dark:text-teal-400">
                    {isLoadingThis ? "جاري الفتح..." : "رصد الدرجات"}
                  </span>
                  <ArrowLeft size={14} className="text-teal-400 transition-transform group-hover:-translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
