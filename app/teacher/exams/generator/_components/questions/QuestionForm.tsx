"use client";

import { useState, useCallback } from "react";
import { Check, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QuestionFormState, QuestionType } from "./types";
import { QUESTION_TYPE_LABELS, inputStyle, validateForm } from "./constants";
import { OptionsEditor } from "./OptionsEditor";

interface QuestionFormProps {
  f: QuestionFormState;
  setF: React.Dispatch<React.SetStateAction<QuestionFormState>>;
  questionIdx: number;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
}

const TYPES: QuestionType[] = ["single_choice", "multiple_choice", "true_false", "essay"];

const SECTION_OPTIONS = [
  { label: "اختر الإجابة الصحيحة", type: "single_choice" as QuestionType },
  { label: "اختر من متعدد", type: "multiple_choice" as QuestionType },
  { label: "ضع علامة (✓) أو (✗)", type: "true_false" as QuestionType },
  { label: "أجب عن الأسئلة التالية", type: "essay" as QuestionType },
  { label: "أكمل العبارات الآتية", type: "essay" as QuestionType },
  { label: "علل لما يأتي", type: "essay" as QuestionType },
  { label: "قارن بين", type: "essay" as QuestionType },
  { label: "اذكر", type: "essay" as QuestionType },
  { label: "صوب ما تحته خط", type: "essay" as QuestionType },
  { label: "رتب", type: "essay" as QuestionType },
  { label: "أخرى...", type: null },
];

const sel: React.CSSProperties = {
  width: "100%", padding: "0.65rem 0.75rem", borderRadius: 10,
  background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--text-primary)", fontSize: "0.88rem", outline: "none",
  fontFamily: "inherit",
};

export function QuestionForm({ f, setF, questionIdx, onSubmit, onCancel, submitLabel }: QuestionFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isPreset = SECTION_OPTIONS.some(o => o.label !== "أخرى..." && o.label === f.sectionName);
  const [selectVal, setSelectVal] = useState<string>(
    f.sectionName === "" ? "" : isPreset ? f.sectionName : "أخرى..."
  );

  const upd = useCallback(<K extends keyof QuestionFormState>(k: K, v: QuestionFormState[K]) =>
    setF(p => ({ ...p, [k]: v })), [setF]);

  const changeType = useCallback((t: QuestionType) => {
    setF(p => {
      if (p.questionType === t) return p;
      return {
        ...p, questionType: t,
        options: t === "true_false" ? ["صح", "خطأ"] : p.questionType === "true_false" ? ["", "", "", ""] : p.options,
        optionImages: t === "true_false" ? [null, null] : p.questionType === "true_false" ? [null, null, null, null] : p.optionImages,
        correctAnswer: "", correctAnswers: [],
      };
    });
  }, [setF]);

  const handleSectionSelect = (val: string) => {
    setSelectVal(val);
    if (val === "") { upd("sectionName", ""); return; }
    if (val === "أخرى...") { upd("sectionName", ""); return; }
    upd("sectionName", val);
    const opt = SECTION_OPTIONS.find(o => o.label === val);
    if (opt?.type) changeType(opt.type);
  };

  const handleSubmit = () => {
    const err = validateForm(f);
    if (err) { setError(err); return; }
    setError(null);
    onSubmit();
  };

  const uploadImage = (file: File) => {
    const r = new FileReader();
    r.onloadend = () => upd("imageBase64", r.result as string);
    r.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
      <style>{formStyles}</style>

      {/* Section title */}
      <div>
        <label className="form-label">عنوان السؤال <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(اختياري)</span></label>
        <select value={selectVal} onChange={e => handleSectionSelect(e.target.value)} style={sel}
          onFocus={e => (e.target.style.borderColor = "var(--color-teal)")}
          onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}>
          <option value="">— بدون عنوان —</option>
          {SECTION_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
        </select>
        {selectVal === "أخرى..." && (
          <Input style={{ marginTop: "0.5rem" }} value={f.sectionName} onChange={e => upd("sectionName", e.target.value)} placeholder="اكتب عنوان السؤال..." />
        )}
      </div>

      {/* Question type */}
      <div>
        <label className="form-label">نوع السؤال</label>
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
          {TYPES.map(t => (
            <button key={t} type="button" onClick={() => changeType(t)}
              style={{
                padding: "0.4rem 0.8rem", borderRadius: 8,
                border: `1px solid ${f.questionType === t ? "var(--color-teal)" : "rgba(255,255,255,0.08)"}`,
                background: f.questionType === t ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.03)",
                color: f.questionType === t ? "var(--color-teal)" : "var(--text-muted)",
                cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                fontFamily: "inherit", transition: "all 0.15s",
              }}>
              {QUESTION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="form-label">نص السؤال <span style={{ color: "var(--color-danger)" }}>*</span></label>
        <textarea value={f.content} onChange={e => upd("content", e.target.value)}
          placeholder="اكتب السؤال هنا..." style={{ ...inputStyle, minHeight: 68 }} />
      </div>

      {/* Image upload */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <label style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "0.4rem 0.8rem", borderRadius: 8,
          border: "1px dashed rgba(255,255,255,0.12)",
          background: f.imageBase64 ? "rgba(20,184,166,0.08)" : "rgba(255,255,255,0.02)",
          color: f.imageBase64 ? "var(--color-teal)" : "var(--text-muted)",
          cursor: "pointer", fontSize: "0.8rem", transition: "all 0.15s",
        }}>
          <Upload size={13} />
          {f.imageBase64 ? "صورة السؤال ✓" : "إرفاق صورة"}
          <input type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const file = e.target.files?.[0]; if (file) uploadImage(file); }} />
        </label>
        {f.imageBase64 && (
          <>
            <div style={{ maxWidth: 110, borderRadius: 7, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
              <img src={f.imageBase64} alt="" style={{ width: "100%", display: "block" }} />
            </div>
            <button type="button" onClick={() => upd("imageBase64", null)}
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, color: "var(--color-danger)", cursor: "pointer", padding: "0.4rem 0.6rem", display: "flex" }}>
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>

      {/* Options */}
      {f.questionType !== "essay" && <OptionsEditor f={f} setF={setF} questionIdx={questionIdx} />}

      {/* Essay */}
      {f.questionType === "essay" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <label className="form-label" style={{ margin: 0 }}>عدد أسطر الإجابة</label>
            <Input type="number" min={1} max={20} value={f.essayLines}
              onChange={e => upd("essayLines", Number(e.target.value))} style={{ width: 75 }} />
          </div>
          <div>
            <label className="form-label">الإجابة النموذجية <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(اختياري)</span></label>
            <textarea value={f.modelAnswer} onChange={e => upd("modelAnswer", e.target.value)}
              placeholder="اكتب الإجابة النموذجية..." style={{ ...inputStyle, minHeight: 68 }} />
          </div>
        </>
      )}

      {/* Marks + notes */}
      <div className="marks-grid">
        <div>
          <label className="form-label">
            الدرجة
            <span style={{ fontSize: "0.65rem", color: "var(--color-teal)", fontWeight: 400, marginRight: 4 }}>
              (تُحسب تلقائياً في المجموع)
            </span>
          </label>
          <Input
            type="number" min={0.5} step={0.5}
            value={f.marks === 0 ? "" : f.marks}
            placeholder="0"
            onChange={e => upd("marks", e.target.value === "" ? 0 : Number(e.target.value))}
          />
        </div>
        <div>
          <label className="form-label">ملاحظات للمدرس</label>
          <Input value={f.teacherNotes} onChange={e => upd("teacherNotes", e.target.value)} placeholder="ملاحظة خاصة..." />
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.45rem 0.8rem", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--color-danger)", fontSize: "0.82rem" }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
        <Button onClick={handleSubmit} leftIcon={<Check size={14} />}>{submitLabel}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel} leftIcon={<X size={14} />}>إلغاء</Button>}
      </div>
    </div>
  );
}

const formStyles = `
  .marks-grid {
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 0.75rem;
  }
  @media (max-width: 400px) {
    .marks-grid { grid-template-columns: 1fr !important; }
  }
`;
