"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Question } from "@/lib/types";
import { emptyForm } from "./types";
import { formToQuestion } from "./constants";
import { QuestionForm } from "./QuestionForm";
import { QuestionCard } from "./QuestionCard";

interface QuestionsEditorProps {
  questions: Question[];
  totalScore: number | null;
  onAddQuestion: (q: Omit<Question, "id" | "bank_id" | "created_at">) => void;
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  onReorder: (questions: Question[]) => void;
  onUpdateTotalScore?: (score: number) => void;
}

export function QuestionsEditor({ questions, totalScore, onAddQuestion, onUpdateQuestion, onDeleteQuestion, onReorder, onUpdateTotalScore }: QuestionsEditorProps) {
  const [addOpen, setAddOpen] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [scoreWarningDismissed, setScoreWarningDismissed] = useState(false);

  const questionsTotal = questions.reduce((s, q) => s + (q.marks ?? 1), 0);
  const isOverScore = totalScore !== null && questionsTotal > totalScore;
  const showWarning = isOverScore && !scoreWarningDismissed;

  useEffect(() => {
    if (isOverScore) setScoreWarningDismissed(false);
  }, [isOverScore]);

  const handleAdd = () => {
    onAddQuestion(formToQuestion(form));
    setForm(emptyForm());
    setAddOpen(false);
  };

  const handleDuplicate = (q: Question) => {
    onAddQuestion({
      content: q.content, question_type: q.question_type,
      options: q.options ? [...q.options] : null,
      option_images: q.option_images ? [...q.option_images] : null,
      correct_answer: q.correct_answer,
      correct_answers: q.correct_answers ? [...q.correct_answers] : null,
      image_base64: q.image_base64, marks: q.marks,
      teacher_notes: q.teacher_notes, essay_lines: q.essay_lines, section_name: null,
    });
  };

  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return;
    const arr = [...questions];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onReorder(arr);
  };

  const handleDrop = (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    moveQuestion(dragIdx, toIdx);
    setDragIdx(null); setDragOverIdx(null);
  };

  return (
    <div style={{ background: "#0f172a", border: "1px solid var(--border-color)", borderRadius: 14, overflow: "hidden" }}>
      <style>{qEditorStyles}</style>

      {/* Score warning */}
      {showWarning && (
        <div style={{
          margin: "0.75rem 0.75rem 0",
          padding: "0.85rem 1rem",
          borderRadius: 10,
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.35)",
          display: "flex", flexDirection: "column", gap: "0.65rem",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
            <AlertTriangle size={16} color="var(--color-amber)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "var(--color-amber)" }}>
                مجموع درجات الأسئلة ({questionsTotal}) يتجاوز الدرجة الكلية ({totalScore})
              </p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                اختر أحد الخيارين:
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", paddingRight: "1.6rem" }}>
            <button
              onClick={() => {
                // scale down all marks proportionally
                const ratio = totalScore! / questionsTotal;
                questions.forEach(q => {
                  const newMark = Math.max(0.5, Math.round((q.marks ?? 1) * ratio * 2) / 2);
                  onUpdateQuestion(q.id, { marks: newMark });
                });
                setScoreWarningDismissed(true);
              }}
              style={{
                padding: "0.45rem 0.9rem", borderRadius: 8, cursor: "pointer",
                background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)",
                color: "var(--color-amber)", fontSize: "0.8rem", fontWeight: 700, fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,158,11,0.2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(245,158,11,0.12)")}
            >
              تقليل درجات الأسئلة تلقائياً
            </button>
            <button
              onClick={() => {
                onUpdateTotalScore?.(questionsTotal);
                setScoreWarningDismissed(true);
              }}
              style={{
                padding: "0.45rem 0.9rem", borderRadius: 8, cursor: "pointer",
                background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)",
                color: "var(--color-teal)", fontSize: "0.8rem", fontWeight: 700, fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(20,184,166,0.16)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(20,184,166,0.08)")}
            >
              الموافقة — تحديث الدرجة الكلية إلى {questionsTotal}
            </button>
          </div>
        </div>
      )}

      {/* Score ok indicator */}
      {totalScore !== null && !isOverScore && questions.length > 0 && (
        <div style={{
          margin: "0.75rem 0.75rem 0",
          padding: "0.5rem 0.85rem",
          borderRadius: 8,
          background: "rgba(52,211,153,0.06)",
          border: "1px solid rgba(52,211,153,0.2)",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <CheckCircle size={13} color="#34d399" />
          <span style={{ fontSize: "0.78rem", color: "#34d399" }}>
            مجموع الدرجات {questionsTotal} من {totalScore}
            {questionsTotal < totalScore && (
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> — متبقي {totalScore - questionsTotal} درجة</span>
            )}
          </span>
        </div>
      )}

      {/* Add panel */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          type="button"
          onClick={() => setAddOpen(p => !p)}
          style={{
            width: "100%", padding: "0.9rem 1rem",
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            color: "var(--text-primary)", fontFamily: "inherit",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={15} color="var(--color-teal)" />
            إضافة سؤال جديد
          </span>
          {addOpen ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
        </button>

        {addOpen && (
          <div style={{ padding: "0 1rem 1rem" }}>
            <QuestionForm f={form} setF={setForm} questionIdx={questions.length} onSubmit={handleAdd} submitLabel="إضافة السؤال" />
          </div>
        )}
      </div>

      {/* Questions list */}
      <div style={{ padding: "0.9rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>الأسئلة ({questions.length})</span>
          {questions.length > 0 && (
            <>
              {["single_choice", "multiple_choice", "true_false", "essay"].map(t => {
                const count = questions.filter(q => (q.question_type || "single_choice") === t).length;
                if (!count) return null;
                const colors: Record<string, { bg: string; color: string; border: string }> = {
                  single_choice: { bg: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "rgba(99,102,241,0.2)" },
                  multiple_choice: { bg: "rgba(168,85,247,0.1)", color: "#d8b4fe", border: "rgba(168,85,247,0.2)" },
                  true_false: { bg: "rgba(245,158,11,0.1)", color: "var(--color-amber)", border: "rgba(245,158,11,0.2)" },
                  essay: { bg: "rgba(20,184,166,0.1)", color: "var(--color-teal)", border: "rgba(20,184,166,0.2)" },
                };
                const labels: Record<string, string> = { single_choice: "اختيار واحد", multiple_choice: "متعدد", true_false: "صح/خطأ", essay: "مقالي" };
                const c = colors[t];
                return (
                  <span key={t} style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: 20, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                    {labels[t]}: {count}
                  </span>
                );
              })}
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginRight: "auto" }}>
                المجموع: {questions.reduce((s, q) => s + (q.marks ?? 1), 0)} درجة
              </span>
            </>
          )}
        </div>

        {questions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            لا يوجد أسئلة — أضف أول سؤال من الأعلى
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {questions.map((q, idx) => (
              <div
                key={q.id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={e => { e.preventDefault(); setDragOverIdx(idx); }}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
              >
                <QuestionCard
                  question={q} index={idx} total={questions.length}
                  onUpdate={onUpdateQuestion} onDelete={onDeleteQuestion}
                  onDuplicate={handleDuplicate}
                  onMoveUp={() => moveQuestion(idx, idx - 1)}
                  onMoveDown={() => moveQuestion(idx, idx + 1)}
                  isDragOver={dragOverIdx === idx}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const qEditorStyles = `
  @media (max-width: 480px) {
    .q-type-badges { display: none !important; }
  }
`;
