"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Exam } from "@/lib/types";
import { examsService } from "@/lib/services/examsService";

type ExamWithScore = Exam & { score: number | null };

export function StudentExamsCard({ studentId }: { studentId: string }) {
  const [exams, setExams] = useState<ExamWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    examsService.getStudentExams(studentId)
      .then((data) => { if (active) setExams([...data].sort((a, b) => (b.exam_date || "").localeCompare(a.exam_date || ""))); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId, attempt]);

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;
  if (error) return <div role="alert"><p>تعذر تحميل الامتحانات والدرجات.</p><button type="button" className="btn btn-secondary" onClick={() => setAttempt(value => value + 1)}>إعادة المحاولة</button></div>;

  return (
    <div className="glass-panel" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
        <ClipboardList size={18} style={{ color: "var(--color-teal)" }} />
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>سجل الامتحانات</h3>
        <span style={{ marginRight: "auto", fontSize: "0.78rem", color: "var(--text-muted)" }}>{exams.length} امتحان</span>
      </div>

      {exams.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem 0" }}>لا توجد امتحانات مسجلة</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {exams.map((exam) => {
            const hasScore = exam.score !== null && exam.score !== undefined;
            const pct = hasScore ? Math.round((exam.score! / exam.max_score) * 100) : null;
            const pass = pct !== null && pct >= 50;
            const pctColor = pct === null ? "var(--text-muted)" : pct >= 85 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
            return (
              <div key={exam.id} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.65rem 0.85rem", borderRadius: 10,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 2 }}>{exam.title}</div>
                  {exam.exam_date && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{exam.exam_date}</div>}
                </div>
                {hasScore ? (
                  <>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: pctColor }}>
                      {exam.score} / {exam.max_score}
                    </span>
                    <span style={{
                      fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: pass ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                      color: pass ? "#10b981" : "#ef4444",
                      border: `1px solid ${pass ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                    }}>
                      {pass ? "ناجح" : "راسب"}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>لم يُرصد</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
