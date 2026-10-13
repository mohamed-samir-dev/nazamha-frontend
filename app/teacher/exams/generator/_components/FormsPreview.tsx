"use client";

import { FormsPreviewProps } from "./preview/types";
import { PreviewSettings } from "./preview/PreviewSettings";
import { PreviewStats } from "./preview/PreviewStats";
import { FormsDisplay } from "./preview/FormsDisplay";
import { ExamPage } from "./preview/ExamPage";
import { AnswerKey } from "./preview/AnswerKey";
import { useFormsPreview } from "../_hooks/useFormsPreview";

export function FormsPreview({
  questions, bankTitle, subject, examDate, teacherName,
  gradeId, groupId, examTotalScore, grades, groups,
}: FormsPreviewProps) {
  const {
    forms, printing, hiddenRef,
    settingsOpen, setSettingsOpen,
    numForms, setNumForms,
    totalScore, scoreError,
    teacher, setTeacher,
    subj, setSubj,
    examTitle, setExamTitle,
    date, setDate,
    gId, setGId,
    grpId, setGrpId,
    instructions, setInstructions,
    sectionOrder, setSectionOrder, SECTION_LABELS,
    generate, printOne,
  } = useFormsPreview(questions, bankTitle, subject, examDate, teacherName, gradeId, groupId, examTotalScore);

  const filteredGroups = gId ? groups.filter(g => g.grade_id === gId) : groups;
  const gradeName = grades.find(g => g.id === gId)?.name || "";
  const groupName = groups.find(g => g.id === grpId)?.name || "";
  const groupCode = grpId ? (groups.find(g => g.id === grpId)?.code || "") : "";

  return (
    <div style={{
      border: "1px solid var(--border-color)",
      borderRadius: 14,
      overflow: "hidden",
    }}>

      <PreviewStats questions={questions} />

      {scoreError && <p role="alert" style={{ padding: "12px 16px", color: "#f87171" }}>{scoreError}</p>}

      <PreviewSettings
        teacher={teacher} setTeacher={setTeacher}
        subj={subj} setSubj={setSubj}
        examTitle={examTitle} setExamTitle={setExamTitle}
        date={date} setDate={setDate}
        gId={gId} setGId={setGId}
        grpId={grpId} setGrpId={setGrpId}
        instructions={instructions} setInstructions={setInstructions}
        sectionOrder={sectionOrder} setSectionOrder={setSectionOrder} sectionLabels={SECTION_LABELS}
        numForms={numForms} setNumForms={setNumForms}
        totalScore={totalScore}
        questions={questions}
        grades={grades}
        filteredGroups={filteredGroups}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        onGenerate={generate}
        forms={forms}
        printing={printing}
        onPrint={printOne}
      />

      <FormsDisplay
        forms={forms}
        bankTitle={bankTitle}
        examTitle={examTitle}
        subj={subj}
        date={date}
        teacher={teacher}
        gradeName={gradeName}
        groupName={groupName}
        groupCode={groupCode}
        totalScore={totalScore}
        instructions={instructions}
      />

      {/* Hidden print container */}
      <div
        ref={hiddenRef}
        aria-hidden="true"
        style={{ position: "fixed", top: 0, left: "-9999px", width: "794px", overflow: "visible", pointerEvents: "none", background: "#fff", opacity: 0 }}
      >
        {forms.map((form, fi) => (
          <ExamPage
            key={form.id} form={form} formIndex={fi} totalPages={forms.length + 1}
            subject={subj} examTitle={examTitle} date={date} teacher={teacher}
            gradeName={gradeName} groupName={groupName} groupCode={groupCode}
            totalScore={totalScore} instructions={instructions}
          />
        ))}
        <AnswerKey
          forms={forms} examTitle={examTitle} bankTitle={bankTitle}
          subject={subj} teacher={teacher} date={date} totalScore={totalScore}
          pageNum={forms.length + 1} totalPages={forms.length + 1}
        />
      </div>
    </div>
  );
}
