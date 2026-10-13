"use client";

import { useState } from "react";
import { Plus, Pencil, Copy, Trash2, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuestionBank, Grade, Group } from "@/lib/types";

interface ExamsSidebarProps {
  exams: QuestionBank[];
  selectedExamId: string | null;
  questionsCount: number;
  grades: Grade[];
  groups: Group[];
  onSelect: (id: string) => void;
  onNew: () => void;
  onEdit: (exam: QuestionBank) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ExamsSidebar({
  exams, selectedExamId, questionsCount, grades, groups,
  onSelect, onNew, onEdit, onDuplicate, onDelete,
}: ExamsSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.subject || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="glass-panel" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText size={15} color="var(--color-teal)" />
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
            الامتحانات
          </span>
          <span style={{ fontSize: "0.72rem", padding: "1px 7px", borderRadius: 20, background: "rgba(20,184,166,0.12)", color: "var(--color-teal)", fontWeight: 700 }}>
            {exams.length}
          </span>
        </div>
        <button onClick={onNew} title="امتحان جديد" style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", color: "var(--color-teal)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Plus size={15} />
        </button>
      </div>

      {/* Search */}
      {exams.length > 3 && (
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
            style={{ width: "100%", padding: "0.5rem 2rem 0.5rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {exams.length === 0 ? "لا يوجد امتحانات بعد" : "لا توجد نتائج"}
          </div>
        ) : filtered.map(exam => {
          const isSelected = selectedExamId === exam.id;
          const grade = exam.grade_id ? grades.find(g => g.id === exam.grade_id) : null;
          const group = exam.group_id ? groups.find(g => g.id === exam.group_id) : null;

          return (
            <div key={exam.id}
              onClick={() => onSelect(exam.id)}
              style={{
                borderRadius: 10, cursor: "pointer", overflow: "hidden",
                background: isSelected ? "rgba(20,184,166,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isSelected ? "rgba(20,184,166,0.4)" : "var(--border-color)"}`,
                transition: "all 0.15s",
              }}>
              <div style={{ padding: "0.65rem 0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: isSelected ? 700 : 500, color: isSelected ? "var(--color-teal)" : "var(--text-primary)", lineHeight: 1.4, flex: 1 }}>
                    {exam.title}
                  </span>
                  <div style={{ display: "flex", gap: 1, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => onEdit(exam)} title="تعديل" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "3px 4px", borderRadius: 5, display: "flex", transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => onDuplicate(exam.id)} title="نسخ" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "3px 4px", borderRadius: 5, display: "flex", transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                      <Copy size={12} />
                    </button>
                    <button onClick={() => onDelete(exam.id)} title="حذف" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "3px 4px", borderRadius: 5, display: "flex", transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--color-danger)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.4rem" }}>
                  {exam.subject && (
                    <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: 20, background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" }}>
                      {exam.subject}
                    </span>
                  )}
                  {grade && (
                    <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: 20, background: "rgba(20,184,166,0.1)", color: "var(--color-teal)", border: "1px solid rgba(20,184,166,0.2)" }}>
                      {grade.name}
                    </span>
                  )}
                  {group && (
                    <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: 20, background: "rgba(245,158,11,0.1)", color: "var(--color-amber)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      {group.name}
                    </span>
                  )}
                  {isSelected && (
                    <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>
                      {questionsCount} سؤال
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
