"use client";

import { useState } from "react";
import {
  AlignLeft, CheckCircle2, CheckSquare, ToggleLeft,
  ChevronUp, ChevronDown, Copy, Trash2, Pencil, GripVertical, Check,
} from "lucide-react";
import { Question } from "@/lib/types";
import { QuestionFormState } from "./types";
import { QUESTION_TYPE_LABELS, questionToForm, formToQuestion } from "./constants";
import { QuestionForm } from "./QuestionForm";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  onUpdate: (id: string, updates: Partial<Question>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (q: Question) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragOver?: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  single_choice: <CheckCircle2 size={12} />,
  multiple_choice: <CheckSquare size={12} />,
  true_false: <ToggleLeft size={12} />,
  essay: <AlignLeft size={12} />,
  mcq: <CheckCircle2 size={12} />,
};

export function QuestionCard({ question, index, total, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, dragHandleProps, isDragOver }: QuestionCardProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<QuestionFormState>(questionToForm(question));

  const startEdit = () => { setForm(questionToForm(question)); setEditing(true); };
  const saveEdit = () => { onUpdate(question.id, formToQuestion(form)); setEditing(false); };

  const qType = question.question_type || "single_choice";
  const typeLabel = QUESTION_TYPE_LABELS[qType as keyof typeof QUESTION_TYPE_LABELS] || qType;

  return (
    <div style={{
      borderRadius: 11,
      border: `1px solid ${isDragOver ? "var(--color-teal)" : "rgba(255,255,255,0.08)"}`,
      background: isDragOver ? "rgba(20,184,166,0.04)" : "rgba(255,255,255,0.02)",
      overflow: "hidden",
      transition: "border-color 0.15s, box-shadow 0.15s",
      boxShadow: isDragOver ? "0 0 0 2px rgba(20,184,166,0.15)" : "none",
    }}>
      <style>{cardStyles}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.4rem",
        padding: "0.6rem 0.85rem",
        borderBottom: editing ? "1px solid rgba(255,255,255,0.06)" : "none",
        background: "rgba(255,255,255,0.02)",
        flexWrap: "wrap",
      }}>
        {/* drag handle — hidden on touch */}
        <div {...dragHandleProps} className="drag-handle" style={{ cursor: "grab", color: "var(--text-muted)", opacity: 0.4, display: "flex", flexShrink: 0 }}>
          <GripVertical size={14} />
        </div>

        <span style={{
          fontSize: "0.75rem", fontWeight: 700, color: "var(--color-teal)",
          background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)",
          borderRadius: 6, padding: "1px 7px", flexShrink: 0,
        }}>
          سؤال {index + 1}
        </span>

        <span className="type-badge" style={{
          display: "flex", alignItems: "center", gap: "0.25rem",
          fontSize: "0.7rem", color: "var(--text-muted)",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 6, padding: "1px 6px", flexShrink: 0,
        }}>
          {TYPE_ICONS[qType]} {typeLabel}
        </span>

        {question.marks != null && (
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginRight: "auto" }}>
            {question.marks} درجة
          </span>
        )}

        <div style={{ display: "flex", gap: 1, marginRight: question.marks == null ? "auto" : 0, flexShrink: 0 }}>
          <ToolBtn title="نقل لأعلى" disabled={index === 0} onClick={onMoveUp}><ChevronUp size={13} /></ToolBtn>
          <ToolBtn title="نقل لأسفل" disabled={index === total - 1} onClick={onMoveDown}><ChevronDown size={13} /></ToolBtn>
          <ToolBtn title="نسخ" onClick={() => onDuplicate(question)}><Copy size={13} /></ToolBtn>
          <ToolBtn title="تعديل" onClick={startEdit} hoverColor="var(--color-teal)"><Pencil size={13} /></ToolBtn>
          <ToolBtn title="حذف" onClick={() => onDelete(question.id)} hoverColor="var(--color-danger)"><Trash2 size={13} /></ToolBtn>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "0.8rem 0.85rem" }}>
        {editing ? (
          <QuestionForm f={form} setF={setForm} questionIdx={index} onSubmit={saveEdit} onCancel={() => setEditing(false)} submitLabel="حفظ التعديل" />
        ) : (
          <QuestionPreview question={question} />
        )}
      </div>
    </div>
  );
}

function QuestionPreview({ question }: { question: Question }) {
  const qType = question.question_type || "single_choice";
  const isMulti = qType === "multiple_choice";
  const correctSet = new Set(
    isMulti ? (question.correct_answers || []) : question.correct_answer ? [question.correct_answer] : []
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      {question.section_name && (
        <div style={{ fontSize: "0.73rem", color: "var(--color-teal)", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 6, padding: "2px 8px", display: "inline-block" }}>
          {question.section_name}
        </div>
      )}
      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
        {question.content}
      </p>
      {question.image_base64 && (
        <div style={{ maxWidth: 180, borderRadius: 7, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          <img src={question.image_base64} alt="" style={{ width: "100%", display: "block" }} />
        </div>
      )}
      {qType === "essay" && (
        <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <AlignLeft size={11} /> مقالي — {question.essay_lines || 3} أسطر
        </span>
      )}
      {question.options && question.options.length > 0 && (
        <div className="options-grid">
          {question.options.map((opt, i) => {
            const img = question.option_images?.[i] ?? null;
            const correct = correctSet.has(opt);
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "0.45rem",
                padding: "0.3rem 0.65rem", borderRadius: 7,
                background: correct ? "rgba(20,184,166,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${correct ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.06)"}`,
                fontSize: "0.82rem",
                color: correct ? "var(--color-teal)" : "var(--text-secondary)",
              }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", minWidth: 14 }}>{i + 1}.</span>
                {img ? <img src={img} alt="" style={{ maxHeight: 32, borderRadius: 4 }} /> : <span>{opt}</span>}
                {correct && <Check size={11} style={{ marginRight: "auto", flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
      {question.teacher_notes && (
        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", padding: "0.3rem 0.65rem", borderRadius: 7, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          📝 {question.teacher_notes}
        </div>
      )}
    </div>
  );
}

function ToolBtn({ children, onClick, title, disabled, hoverColor }: { children: React.ReactNode; onClick: () => void; title?: string; disabled?: boolean; hoverColor?: string }) {
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick}
      style={{
        background: "transparent", border: "none",
        cursor: disabled ? "default" : "pointer",
        color: disabled ? "rgba(255,255,255,0.15)" : "var(--text-muted)",
        padding: "4px 5px", borderRadius: 6, display: "flex", alignItems: "center",
        transition: "color 0.15s",
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = hoverColor || "var(--text-primary)"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.color = "var(--text-muted)"; }}
    >
      {children}
    </button>
  );
}

const cardStyles = `
  .options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.3rem;
  }
  @media (max-width: 500px) {
    .options-grid { grid-template-columns: 1fr !important; }
    .drag-handle { display: none !important; }
    .type-badge { display: none !important; }
  }
`;
