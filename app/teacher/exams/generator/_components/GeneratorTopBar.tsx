"use client";

import { FileText, BookOpen, LayoutTemplate, ChevronLeft } from "lucide-react";
import { QuestionBank } from "@/lib/types";

type Tab = "questions" | "preview";

interface GeneratorTopBarProps {
  sidebarOpen: boolean;
  selectedExam: QuestionBank | null;
  questionsCount: number;
  tab: Tab;
  onToggleSidebar: () => void;
  onTabChange: (t: Tab) => void;
}

export function GeneratorTopBar({
  sidebarOpen, selectedExam, questionsCount, tab, onToggleSidebar, onTabChange,
}: GeneratorTopBarProps) {
  return (
    <div style={{
      padding: "0 1.25rem",
      borderBottom: "1px solid var(--border-color)",
      background: "linear-gradient(180deg, var(--bg-secondary) 0%, rgba(8,12,20,0.98) 100%)",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      height: 56,
      flexShrink: 0,
    }}>

      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        title={sidebarOpen ? "إخفاء القائمة" : "إظهار القائمة"}
        style={{
          width: 30, height: 30, borderRadius: 8,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border-color)",
          color: "var(--text-muted)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s", flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      >
        <ChevronLeft size={14} style={{ transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.3s" }} />
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: "var(--border-color)", flexShrink: 0 }} />

      {/* Page title */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={12} color="var(--color-teal)" />
        </div>
        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)" }}>نماذج الامتحانات</span>
      </div>

      {/* Breadcrumb */}
      {selectedExam ? (
        <>
          <span style={{ color: "var(--text-muted)", fontSize: "1rem", fontWeight: 300 }}>/</span>
          <span style={{
            fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600,
            maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {selectedExam.title}
          </span>
          {selectedExam.subject && (
            <span style={{ fontSize: "0.67rem", padding: "2px 8px", borderRadius: 20, background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.18)", fontWeight: 600 }}>
              {selectedExam.subject}
            </span>
          )}
          <span style={{ fontSize: "0.67rem", padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: "var(--text-muted)", marginRight: "auto", border: "1px solid var(--border-color)" }}>
            {questionsCount} سؤال
          </span>
        </>
      ) : (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginRight: "auto" }}>
          اختر امتحاناً من القائمة للبدء
        </span>
      )}

      {/* Tabs */}
      {selectedExam && (
        <div style={{
          display: "flex", gap: "0.2rem",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 10, padding: "3px",
          border: "1px solid var(--border-color)",
        }}>
          {([
            { key: "questions" as Tab, label: "الأسئلة", icon: <BookOpen size={12} /> },
            { key: "preview" as Tab, label: "توليد النماذج", icon: <LayoutTemplate size={12} /> },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                padding: "0.35rem 0.85rem", borderRadius: 7, border: "none",
                background: tab === t.key
                  ? "linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.07))"
                  : "transparent",
                color: tab === t.key ? "var(--color-teal)" : "var(--text-muted)",
                fontWeight: tab === t.key ? 700 : 500,
                fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
                borderRight: tab === t.key ? "2px solid var(--color-teal)" : "2px solid transparent",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
