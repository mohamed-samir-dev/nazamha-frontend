"use client";

import { Suspense } from "react";
import { useExamsPage } from "./_hooks/useExamsPage";
import { ExamsHeader } from "./_components/ExamsHeader";
import { ExamsList } from "./_components/ExamsList";
import { GradeEntryTable } from "./_components/GradeEntryTable";
import { ClipboardList, CheckCircle2, AlertCircle } from "lucide-react";

function ExamsPageContent() {
  const {
    loading,
    loadingExamId,
    userId,
    teacherName,
    grades,
    groups,
    selectedGradeId,
    selectedGroupId,
    handleGradeSelect,
    handleGroupSelect,
    exams,
    students,
    selectedExam,
    handleSelectBank,
    handleBackToExams,
    toast,
    showToast,
  } = useExamsPage();

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="flex flex-col gap-3 sm:gap-4 px-3 sm:px-6 py-3 sm:py-6 max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl font-semibold text-sm shadow-2xl text-white backdrop-blur-md transition-all flex items-center gap-2 max-w-md ${
            toast.type === "error"
              ? "bg-red-500/90 border border-red-400/40"
              : "bg-teal-600/90 border border-teal-400/40"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} className="shrink-0 text-red-200" />
          ) : (
            <CheckCircle2 size={18} className="shrink-0 text-teal-200" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-wrapper py-20 flex flex-col items-center justify-center gap-3">
          <div className="spinner" />
          <span className="text-xs text-[var(--text-muted)] font-medium">جاري تحميل الامتحانات...</span>
        </div>
      ) : selectedExam ? (
        <GradeEntryTable
          exam={selectedExam}
          students={students}
          groupName={selectedGroup?.name ?? ""}
          teacherName={teacherName}
          teacherId={userId ?? undefined}
          onBack={handleBackToExams}
          showToast={showToast}
        />
      ) : (
        <>
          <ExamsHeader
            grades={grades}
            groups={groups}
            selectedGradeId={selectedGradeId}
            selectedGroupId={selectedGroupId}
            onGradeSelect={handleGradeSelect}
            onGroupSelect={handleGroupSelect}
          />

          {selectedGroupId ? (
            <ExamsList
              exams={exams}
              onSelectExam={handleSelectBank}
              loadingExamId={loadingExamId}
            />
          ) : (
            <div className="glass-panel flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <ClipboardList size={26} className="text-teal-400" />
              </div>
              <p className="text-[var(--text-primary)] text-sm font-bold m-0">اختر الصف ثم المجموعة لعرض الامتحانات</p>
              <p className="text-[var(--text-muted)] text-xs m-0">ستظهر جميع نماذج الامتحانات المتاحة لتتمكن من رصد درجات الطلاب</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ExamsPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-wrapper py-20 flex flex-col items-center justify-center gap-3">
          <div className="spinner" />
          <span className="text-xs text-[var(--text-muted)] font-medium">جاري التحميل...</span>
        </div>
      }
    >
      <ExamsPageContent />
    </Suspense>
  );
}
