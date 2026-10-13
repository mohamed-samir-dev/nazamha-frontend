import { CheckCircle2, XCircle, Calendar } from "lucide-react";
import { StudentReport, arabicMonths } from "./types";

export default function AttendanceCard({ report, monthIndex }: { report: StudentReport; monthIndex: number }) {
  const pct = report.attendance_total > 0
    ? Math.round((report.attendance_present / report.attendance_total) * 100)
    : 0;
  const pctColor = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="report-card" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", backdropFilter: "blur(10px)" }}>
      <h3 style={{ color: "#14b8a6", fontSize: "1rem", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Calendar size={18} />
        الحضور والغياب — {arabicMonths[monthIndex]}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div style={{ textAlign: "center", padding: "1rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "12px" }}>
          <CheckCircle2 size={22} style={{ color: "#10b981", marginBottom: "0.25rem" }} />
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10b981" }}>{report.attendance_present}</div>
          <div className="report-text-muted" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>حضور</div>
        </div>
        <div style={{ textAlign: "center", padding: "1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px" }}>
          <XCircle size={22} style={{ color: "#ef4444", marginBottom: "0.25rem" }} />
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ef4444" }}>{report.attendance_absent}</div>
          <div className="report-text-muted" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>غياب</div>
        </div>
        <div style={{ textAlign: "center", padding: "1rem", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px" }}>
          <Calendar size={22} style={{ color: "#3b82f6", marginBottom: "0.25rem" }} />
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#3b82f6" }}>{report.attendance_total}</div>
          <div className="report-text-muted" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>إجمالي</div>
        </div>
      </div>

      {/* Progress bar */}
      {report.attendance_total > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>نسبة الحضور</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: pctColor }}>{pct}%</span>
          </div>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pctColor, borderRadius: "4px", transition: "width 0.5s ease" }} />
          </div>
        </div>
      )}
    </div>
  );
}
