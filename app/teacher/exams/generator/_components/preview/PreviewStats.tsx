"use client";

import { Question } from "@/lib/types";
import { Hash, CheckSquare, AlignLeft, Layers, Star } from "lucide-react";

interface PreviewStatsProps {
  questions: Question[];
}

export function PreviewStats({ questions }: PreviewStatsProps) {
  const mcqCount = questions.filter(q => ["single_choice", "multiple_choice", "true_false", "mcq"].includes(q.question_type || "")).length;
  const essayCount = questions.filter(q => q.question_type === "essay").length;
  const sectionsCount = new Set(questions.map(q => q.section_name || "").filter(Boolean)).size;
  const totalScore = questions.reduce((s, q) => s + (q.marks ?? 1), 0);

  const stats = [
    { label: "إجمالي الأسئلة", val: questions.length, color: "#818cf8", bg: "rgba(129,140,248,0.08)", icon: <Hash size={13} /> },
    { label: "اختيار متعدد", val: mcqCount, color: "var(--color-teal)", bg: "rgba(20,184,166,0.08)", icon: <CheckSquare size={13} /> },
    { label: "مقالي", val: essayCount, color: "var(--color-amber)", bg: "rgba(245,158,11,0.08)", icon: <AlignLeft size={13} /> },
    { label: "الدرجة الكلية", val: `${totalScore}د`, color: "#34d399", bg: "rgba(52,211,153,0.08)", icon: <Star size={13} /> },
  ];

  return (
    <>
      <style>{`
        .preview-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid var(--border-color);
        }
        @media (max-width: 480px) {
          .preview-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .preview-stats > div:nth-child(2) { border-left: 1px solid var(--border-color) !important; }
          .preview-stats > div:nth-child(3) { border-top: 1px solid var(--border-color) !important; border-left: none !important; }
          .preview-stats > div:nth-child(4) { border-top: 1px solid var(--border-color) !important; }
        }
      `}</style>
      <div className="preview-stats">
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: "0.8rem 0.75rem", textAlign: "center",
            borderLeft: i < 3 ? "1px solid var(--border-color)" : "none",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
          }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
              {s.icon}
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}
