import { User, ClipboardList } from "lucide-react";
import { StudentReport } from "./types";

export default function StudentInfoCard({ report }: { report: StudentReport }) {
  const fields = [
    { label: "السنة الدراسية", value: report.grade_name },
    { label: "المجموعة",       value: report.group_name },
    { label: "اليوم",          value: report.group_day },
    { label: "الموعد",         value: report.group_time },
  ].filter((f) => f.value);

  const hasLastExam = report.last_exam_title && report.last_exam_score !== undefined;
  const examPct = hasLastExam && report.last_exam_max
    ? Math.round((report.last_exam_score! / report.last_exam_max) * 100)
    : null;
  const examPass = examPct !== null && examPct >= 50;
  const examColor = examPct === null ? "rgba(255,255,255,0.5)" : examPct >= 85 ? "#10b981" : examPct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="report-card" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", backdropFilter: "blur(10px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: fields.length ? "1.25rem" : 0 }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #14b8a6, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <User size={24} style={{ color: "#fff" }} />
        </div>
        <div>
          <h2 className="report-text-white" style={{ fontSize: "1.25rem", color: "#ffffff", margin: 0 }}>
            {report.name}
          </h2>
          {report.code && (
            <p className="report-text-muted" style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "0.85rem" }}>
              الكود: {report.code}
            </p>
          )}
        </div>
      </div>

      {fields.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: hasLastExam ? "1rem" : 0 }}>
          {fields.map(({ label, value }) => (
            <div key={label} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
              <span className="report-text-label" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", display: "block" }}>
                {label}
              </span>
              <span className="report-text-white" style={{ color: "#fff", fontWeight: 600 }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {hasLastExam && (
        <div style={{ padding: "0.85rem", background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
            <ClipboardList size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>آخر امتحان</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem" }}>{report.last_exam_title}</div>
              {report.last_exam_date && <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", marginTop: 2 }}>{report.last_exam_date}</div>}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: examColor }}>
                {report.last_exam_score} / {report.last_exam_max}
              </div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: examPass ? "#10b981" : "#ef4444", textAlign: "center" }}>
                {examPass ? "ناجح" : "راسب"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
