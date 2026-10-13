"use client";

import { GeneratedForm, formLabel } from "./types";
import { ExamPage } from "./ExamPage";
import { AnswerKey } from "./AnswerKey";
import { FileText, Key } from "lucide-react";

interface FormsDisplayProps {
  forms: GeneratedForm[];
  bankTitle: string;
  examTitle: string;
  subj: string;
  date: string;
  teacher: string;
  gradeName: string;
  groupName: string;
  groupCode: string;
  totalScore: number;
  instructions: string[];
}

export function FormsDisplay({ forms, bankTitle, examTitle, subj, date, teacher, gradeName, groupName, groupCode, totalScore, instructions }: FormsDisplayProps) {
  if (!forms.length) return null;

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", padding: "0.2rem 0.85rem", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", whiteSpace: "nowrap" }}>
          {forms.length} نماذج + مفتاح الإجابات
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
      </div>

      {forms.map((form, fi) => (
        <div key={form.id}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.65rem" }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={11} color="var(--color-teal)" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.83rem", color: "var(--color-teal)" }}>
              نموذج ( {formLabel(fi)} )
            </span>
          </div>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: "0.85rem", overflowX: "auto", border: "1px solid var(--border-color)", WebkitOverflowScrolling: "touch" }}>
            <div style={{ minWidth: 480 }}>
              <ExamPage
                form={form} formIndex={fi} totalPages={forms.length + 1}
                subject={subj} examTitle={examTitle} date={date} teacher={teacher}
                gradeName={gradeName} groupName={groupName} groupCode={groupCode}
                totalScore={totalScore} instructions={instructions}
              />
            </div>
          </div>
        </div>
      ))}

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.65rem" }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Key size={11} color="var(--color-amber)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.83rem", color: "var(--color-amber)" }}>
            نموذج المدرس (مفتاح الإجابات)
          </span>
        </div>
        <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: "0.85rem", overflowX: "auto", border: "1px solid rgba(245,158,11,0.15)", WebkitOverflowScrolling: "touch" }}>
          <div style={{ minWidth: 480 }}>
            <AnswerKey
              forms={forms} examTitle={examTitle} bankTitle={bankTitle}
              subject={subj} teacher={teacher} date={date} totalScore={totalScore}
              pageNum={forms.length + 1} totalPages={forms.length + 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
