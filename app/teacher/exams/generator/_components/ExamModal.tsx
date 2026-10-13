"use client";

import { useState, useEffect } from "react";
import { X, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Grade, Group } from "@/lib/types";
import { ExamForm, emptyExamForm } from "../_hooks/useExamsGenerator";

interface ExamModalProps {
  mode: "create" | "edit";
  initialData?: ExamForm;
  grades: Grade[];
  groups: Group[];
  filteredGroups: (gradeId: string) => Group[];
  onSubmit: (form: ExamForm) => Promise<any>;
  onClose: () => void;
}

const sel: React.CSSProperties = {
  width: "100%", padding: "0.65rem 0.75rem", borderRadius: "10px",
  background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--text-primary)", fontSize: "0.9rem", outline: "none",
  transition: "border-color 0.2s",
};

export function ExamModal({ mode, initialData, grades, groups, filteredGroups, onSubmit, onClose }: ExamModalProps) {
  const [form, setForm] = useState<ExamForm>(initialData || emptyExamForm);
  const [scoreInput, setScoreInput] = useState(String((initialData || emptyExamForm).total_score));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const f = initialData || emptyExamForm;
    setForm(f);
    setScoreInput(String(f.total_score));
  }, [initialData]);

  const set = (k: keyof ExamForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const finalForm = { ...form, total_score: Number(scoreInput) || 0 };
    try { await onSubmit(finalForm); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <style>{modalStyles}</style>
      <div className="modal-content exam-modal-content">

        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={17} color="var(--color-teal)" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                {mode === "create" ? "إنشاء امتحان جديد" : "تعديل بيانات الامتحان"}
              </p>
              <p style={{ margin: 0, fontSize: "0.73rem", color: "var(--text-muted)" }}>
                {mode === "create" ? "أدخل بيانات الامتحان الجديد" : "عدّل البيانات ثم احفظ"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div className="exam-modal-grid">
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">اسم الامتحان <span style={{ color: "var(--color-danger)" }}>*</span></label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="مثال: امتحان الفصل الأول" />
            </div>
            <div>
              <label className="form-label">المادة</label>
              <Input value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="مثال: الفيزياء" />
            </div>
            <div>
              <label className="form-label">تاريخ الامتحان</label>
              <Input type="date" value={form.exam_date} onChange={e => set("exam_date", e.target.value)} />
            </div>
            <div>
              <label className="form-label">الصف الدراسي</label>
              <select value={form.grade_id} onChange={e => set("grade_id", e.target.value)} style={sel}
                onFocus={e => (e.target.style.borderColor = "var(--color-teal)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}>
                <option value="">— كل الفرق —</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">المجموعة</label>
              <select value={form.group_id} onChange={e => set("group_id", e.target.value)} style={sel}
                onFocus={e => (e.target.style.borderColor = "var(--color-teal)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}>
                <option value="">— كل المجموعات —</option>
                {filteredGroups(form.grade_id).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">الدرجة الكلية <span style={{ color: "var(--color-danger)" }}>*</span></label>
              <Input
                type="number" min={1} step={1}
                value={scoreInput}
                onChange={e => setScoreInput(e.target.value)}
                onBlur={() => { if (scoreInput === "" || scoreInput === "-") setScoreInput("0"); }}
                placeholder="مثال: 100"
              />
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                ستتحكم في درجة كل سؤال بشكل منفصل عند إضافته، والمجموع يجب ألا يتجاوز هذا الرقم.
              </p>
            </div>
            <div style={{ gridColumn: "1 / -1" }} />
          </div>
        </div>

        <div style={{ padding: "0.85rem 1.25rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.65rem", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={!form.title.trim() || saving}>
            {saving ? "جاري الحفظ..." : mode === "create" ? "إنشاء الامتحان" : "حفظ التعديلات"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const modalStyles = `
  .exam-modal-content {
    max-width: 500px;
    width: calc(100vw - 2rem);
  }
  .exam-modal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.7rem;
  }
  @media (max-width: 420px) {
    .exam-modal-content { width: calc(100vw - 1rem) !important; }
    .exam-modal-grid { grid-template-columns: 1fr !important; }
    .exam-modal-grid > div[style*="1 / -1"] { grid-column: 1 !important; }
  }
`;
