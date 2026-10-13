"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ML } from "./types";

export type ActionType = "preview" | "print" | "export";

interface FormSelectionModalProps {
  action: ActionType;
  numForms: number;
  onConfirm: (selectedIndices: number[]) => void;
  onClose: () => void;
}

const ACTION_LABELS: Record<ActionType, string> = {
  preview: "معاينة النموذج",
  print: "طباعة",
  export: "تصدير PDF",
};

// "نموذج المدرس" = index -1 (answer key), forms = 0..numForms-1
export function FormSelectionModal({ action, numForms, onConfirm, onClose }: FormSelectionModalProps) {
  // indices: -1 = answer key, 0..numForms-1 = forms
  const allIndices = [-1, ...Array.from({ length: numForms }, (_, i) => i)];
  const [selected, setSelected] = useState<Set<number>>(new Set(allIndices));

  useEffect(() => {
    setSelected(new Set(allIndices));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numForms]);

  const toggle = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allIndices));
  const clearAll = () => setSelected(new Set());

  const formLabel = (idx: number) =>
    idx === -1 ? "نموذج المدرس (الأصل)" : `النموذج (${ML[idx] ?? idx + 1})`;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--bg-card, #1e293b)",
        border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
        borderRadius: 16, padding: "1.5rem", width: 380, maxWidth: "90vw",
        display: "flex", flexDirection: "column", gap: "1rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
            اختر النموذج — {ACTION_LABELS[action]}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* Select all / clear */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={selectAll} style={chipBtn}>تحديد الكل</button>
          <button onClick={clearAll} style={chipBtn}>إلغاء تحديد الكل</button>
          <span style={{ marginRight: "auto", fontSize: "0.78rem", color: "var(--text-muted)", alignSelf: "center" }}>
            {selected.size} من أصل {allIndices.length}
          </span>
        </div>

        {/* List */}
        <div style={{
          background: "rgba(15,23,42,0.5)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, padding: "0.5rem 0.75rem",
          display: "flex", flexDirection: "column", gap: "0.5rem",
        }}>
          {allIndices.map(idx => (
            <label key={idx} style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              cursor: "pointer", fontSize: "0.88rem",
              color: selected.has(idx) ? "var(--text-primary)" : "var(--text-muted)",
              padding: "0.3rem 0",
            }}>
              <input
                type="checkbox"
                checked={selected.has(idx)}
                onChange={() => toggle(idx)}
                style={{ accentColor: "var(--color-teal)", width: 16, height: 16, flexShrink: 0 }}
              />
              {formLabel(idx)}
            </label>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button
            onClick={() => selected.size > 0 && onConfirm(Array.from(selected).sort((a, b) => a - b))}
            disabled={selected.size === 0}
          >
            متابعة
          </Button>
        </div>
      </div>
    </div>
  );
}

const chipBtn: React.CSSProperties = {
  padding: "3px 10px", borderRadius: 20, fontSize: "0.78rem",
  background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)",
  color: "var(--color-teal)", cursor: "pointer", fontFamily: "inherit",
};
