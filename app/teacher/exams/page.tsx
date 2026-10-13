"use client";

import { useExamsPage } from "./_hooks/useExamsPage";
import { ExamsHeader } from "./_components/ExamsHeader";
import { ExamsList } from "./_components/ExamsList";
import { GradeEntryTable } from "./_components/GradeEntryTable";
import { ClipboardList } from "lucide-react";

export default function ExamsPage() {
  const {
    loading,
    grades,
    groups,
    selectedGradeId,
    selectedGroupId,
    handleGradeSelect,
    handleGroupSelect,
    exams,
    students,
    selectedExam,
    setSelectedExam,
    handleSelectBank,
    toast,
    showToast,
    teacherName,
  } = useExamsPage();

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="flex flex-col gap-3 sm:gap-4 px-3 sm:px-6 py-3 sm:py-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl font-semibold text-sm shadow-2xl text-white backdrop-blur-md transition-all w-[calc(100%-2rem)] max-w-sm text-center ${
          toast.type === "error"
            ? "bg-red-500/90 border border-red-400/30"
            : "bg-teal-500/90 border border-teal-400/30"
        }`}>
          {toast.message}
        </div>
      )}

      {loading ? (
        <div className="loading-wrapper"><div className="spinner" /></div>
      ) : selectedExam ? (
        <GradeEntryTable
          exam={selectedExam}
          students={students}
          groupName={selectedGroup?.name ?? ""}
          teacherName={teacherName}
          onBack={() => setSelectedExam(null)}
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
            <ExamsList exams={exams} onSelectExam={handleSelectBank} />
          ) : (
            <div className="glass-panel flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <ClipboardList size={26} className="text-teal-400" />
              </div>
              <p className="text-[var(--text-muted)] text-sm font-medium">اختر الصف والمجموعة لعرض الامتحانات</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
