"use client";

import { FileText, Plus, Search, Pencil, Copy, Trash2 } from "lucide-react";
import { QuestionBank, Grade, Group } from "@/lib/types";

interface GeneratorSidebarProps {
  open: boolean;
  exams: QuestionBank[];
  filtered: QuestionBank[];
  selectedExamId: string | null;
  search: string;
  grades: Grade[];
  groups: Group[];
  onSearch: (v: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onEdit: (exam: QuestionBank) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GeneratorSidebar({
  open, exams, filtered, selectedExamId, search, grades, groups,
  onSearch, onSelect, onNew, onEdit, onDuplicate, onDelete,
}: GeneratorSidebarProps) {
  return (
    <aside style={{
      width: open ? 272 : 0,
      minWidth: open ? 272 : 0,
      overflow: "hidden",
      transition: "width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)",
      borderLeft: "1px solid var(--border-color)",
      background: "linear-gradient(180deg, var(--bg-secondary) 0%, rgba(8,12,20,0.98) 100%)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>

      {/* Header */}
      <div style={{
        padding: "1rem",
        borderBottom: "1px solid var(--border-color)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={15} color="var(--color-teal)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.2 }}>الامتحانات</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>{exams.length} امتحان</div>
          </div>
        </div>
        <button
          onClick={onNew}
          title="امتحان جديد"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(20,184,166,0.1)",
            border: "1px solid rgba(20,184,166,0.25)",
            color: "var(--color-teal)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(20,184,166,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(20,184,166,0.1)"; }}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Search */}
      {exams.length > 3 && (
        <div style={{ padding: "0.65rem 0.75rem", borderBottom: "1px solid var(--border-color)", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <Search size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              value={search} onChange={e => onSearch(e.target.value)}
              placeholder="بحث..."
              style={{
                width: "100%", padding: "0.45rem 1.8rem 0.45rem 0.65rem",
                borderRadius: 8, background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)", fontSize: "0.8rem",
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(20,184,166,0.5)")}
              onBlur={e => (e.target.style.borderColor = "var(--border-color)")}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            {exams.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.85rem" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "rgba(20,184,166,0.07)",
                  border: "1px solid rgba(20,184,166,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FileText size={20} color="var(--color-teal)" style={{ opacity: 0.6 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, fontSize: "0.83rem" }}>لا يوجد امتحانات</div>
                  <div style={{ fontSize: "0.73rem" }}>ابدأ بإنشاء أول امتحان</div>
                </div>
                <button
                  onClick={onNew}
                  style={{
                    padding: "0.45rem 1.1rem", borderRadius: 8,
                    background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)",
                    color: "var(--color-teal)", cursor: "pointer",
                    fontSize: "0.78rem", fontFamily: "inherit", fontWeight: 600,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(20,184,166,0.18)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(20,184,166,0.1)")}
                >
                  + إنشاء أول امتحان
                </button>
              </div>
            ) : <span>لا توجد نتائج</span>}
          </div>
        ) : filtered.map(exam => {
          const isSelected = selectedExamId === exam.id;
          const grade = exam.grade_id ? grades.find(g => g.id === exam.grade_id) : null;
          const group = exam.group_id ? groups.find(g => g.id === exam.group_id) : null;

          return (
            <div
              key={exam.id}
              onClick={() => onSelect(exam.id)}
              style={{
                borderRadius: 10, cursor: "pointer", marginBottom: "0.3rem",
                background: isSelected
                  ? "linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.05))"
                  : "transparent",
                border: `1px solid ${isSelected ? "rgba(20,184,166,0.4)" : "transparent"}`,
                borderRight: isSelected ? "3px solid var(--color-teal)" : "3px solid transparent",
                transition: "all 0.18s",
                padding: "0.65rem 0.75rem",
              }}
              onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.border = "1px solid var(--border-color)"; e.currentTarget.style.borderRight = "3px solid transparent"; } }}
              onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.border = "1px solid transparent"; e.currentTarget.style.borderRight = "3px solid transparent"; } }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.83rem", fontWeight: isSelected ? 700 : 500, color: isSelected ? "var(--color-teal)" : "var(--text-primary)", lineHeight: 1.4, flex: 1 }}>
                  {exam.title}
                </span>
                <div style={{ display: "flex", gap: 1, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <SidebarBtn title="تعديل" onClick={() => onEdit(exam)} hoverColor="var(--text-primary)"><Pencil size={11} /></SidebarBtn>
                  <SidebarBtn title="نسخ" onClick={() => onDuplicate(exam.id)} hoverColor="var(--color-teal)"><Copy size={11} /></SidebarBtn>
                  <SidebarBtn title="حذف" onClick={() => onDelete(exam.id)} hoverColor="var(--color-danger)"><Trash2 size={11} /></SidebarBtn>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.4rem" }}>
                {exam.subject && <Badge color="#a5b4fc" bg="rgba(99,102,241,0.1)" border="rgba(99,102,241,0.18)">{exam.subject}</Badge>}
                {grade && <Badge color="var(--color-teal)" bg="rgba(20,184,166,0.08)" border="rgba(20,184,166,0.18)">{grade.name}</Badge>}
                {group && <Badge color="var(--color-amber)" bg="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.18)">{group.name}</Badge>}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function SidebarBtn({ children, onClick, title, hoverColor }: { children: React.ReactNode; onClick: () => void; title: string; hoverColor: string }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "3px 4px", borderRadius: 5, display: "flex", transition: "color 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
      {children}
    </button>
  );
}

function Badge({ children, color, bg, border }: { children: React.ReactNode; color: string; bg: string; border: string }) {
  return (
    <span style={{ fontSize: "0.67rem", padding: "2px 7px", borderRadius: 20, background: bg, color, border: `1px solid ${border}`, fontWeight: 600 }}>
      {children}
    </span>
  );
}
