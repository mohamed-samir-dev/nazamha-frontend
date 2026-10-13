"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, Save, Hash, RefreshCw } from "lucide-react";
import { Book, Grade, Group } from "@/lib/types";
import { BooksService } from "@/lib/services/booksService";
import { getErrorMessage } from "@/lib/errors";

interface Props {
  book: Book | null;
  grades: Grade[];
  groups: Group[];
  onClose: () => void;
  onSaved: () => void;
}

function generateCode(name: string): string {
  const prefix = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w.replace(/[^a-zA-Z\u0600-\u06FF]/g, "").slice(0, 3).toUpperCase())
    .join("-")
    || "BK";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

export default function BookFormModal({ book, grades, groups, onClose, onSaved }: Props) {
  const gradeIdsWithGroups = new Set(groups.map((g) => g.grade_id).filter(Boolean));
  const availableGrades = grades.filter((g) => gradeIdsWithGroups.has(g.id));
  const [form, setForm] = useState({
    name: book?.name ?? "",
    grade_id: book?.grade_id ?? "",
    price: book?.price != null ? String(book.price) : "",
    status: book?.status ?? "available",
    code: book?.code ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // جنريت كود تلقائي عند الإضافة
  useEffect(() => {
    if (!book && !form.code) {
      setForm(p => ({ ...p, code: generateCode(p.name || "كتاب") }));
    }
  }, []);

  // إعادة جنريت الكود لما يتغير الاسم (للإضافة فقط)
  const handleNameChange = (v: string) => {
    setForm(p => ({
      ...p,
      name: v,
      code: !book ? generateCode(v || "كتاب") : p.code,
    }));
  };

  const regenerateCode = () => setForm(p => ({ ...p, code: generateCode(p.name || "كتاب") }));

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("اسم الكتاب مطلوب"); return; }
    if (!form.price || isNaN(Number(form.price))) { setError("السعر مطلوب"); return; }
    setSaving(true);
    setError("");
    try {
      const data = {
        name: form.name.trim(),
        grade_id: form.grade_id || null,
        price: Number(form.price),
        status: form.status as "available" | "unavailable",
        code: form.code.trim() || null,
      };
      if (book) await BooksService.updateBook(book.id, data);
      else await BooksService.createBook(data);
      onSaved();
    } catch (e: unknown) {
      setError(getErrorMessage(e, "حدث خطأ أثناء حفظ الكتاب."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "460px", padding: "1.5rem", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 34, height: 34, borderRadius: "9px", background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={16} style={{ color: "var(--color-teal)" }} />
            </div>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>
              {book ? "تعديل الكتاب" : "إضافة كتاب جديد"}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px", borderRadius: "6px" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>

          {/* Name */}
          <Field label="اسم الكتاب *">
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="مثال: كتاب الفيزياء"
              className="form-input"
            />
          </Field>

          {/* Code (auto-generated, read-only for new, editable for existing) */}
          <Field label="كود الكتاب" icon={<Hash size={12} />}>
            <div style={{ position: "relative" }}>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="يتولد تلقائياً"
                className="form-input"
                style={{ paddingLeft: "2.4rem", fontFamily: "monospace", letterSpacing: "0.05em", color: "var(--color-teal)" }}
                readOnly={!book}
              />
              {!book && (
                <button
                  type="button"
                  onClick={regenerateCode}
                  title="توليد كود جديد"
                  style={{ position: "absolute", left: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px", display: "flex", alignItems: "center" }}
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </div>
            {!book && (
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0.25rem 0 0", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ color: "var(--color-teal)", fontSize: "0.65rem" }}>●</span>
                يتولد تلقائياً · اضغط <RefreshCw size={10} style={{ display: "inline" }} /> لتوليد كود جديد
              </p>
            )}
          </Field>

          {/* Grade */}
          <Field label="السنة الدراسية">
            <select value={form.grade_id} onChange={(e) => set("grade_id", e.target.value)} className="form-input">
              <option value="">-- اختر السنة الدراسية --</option>
              {availableGrades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>

          {/* Price + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem" }}>
            <Field label="السعر (جنيه) *">
              <input type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0" className="form-input" />
            </Field>
            <Field label="الحالة">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="form-input">
                <option value="available">متاح</option>
                <option value="unavailable">غير متاح</option>
              </select>
            </Field>
          </div>

          {error && (
            <div style={{ padding: "0.6rem 0.85rem", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "0.82rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
              إلغاء
            </button>
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: "0.65rem", borderRadius: "8px", background: "var(--color-teal)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: saving ? 0.7 : 1 }}>
              <Save size={14} /> {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
