"use client";

import { useEffect, useState } from "react";
import { api as apiClient } from "@/lib/apiClient";
import { Spinner } from "@/components/ui/Spinner";
import { TbCalendarStats } from "react-icons/tb";

interface MonthSummary {
  month: number;
  year: number;
  present: number;
  absent: number;
}

const MONTHS_AR = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export function StudentAttendanceCard({ studentId }: { studentId: string }) {
  const [summary, setSummary] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/attendance/summary/${studentId}`)
      .then((data) => setSummary(data as MonthSummary[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  const totalPresent = summary.reduce((s, m) => s + m.present, 0);
  const totalAbsent  = summary.reduce((s, m) => s + m.absent, 0);
  const totalSessions = totalPresent + totalAbsent;
  const overallPct = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

  if (loading) return <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}><Spinner /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* إجمالي */}
      <div className="attendance-stats-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem",
      }}>
        {[
          { label: "إجمالي الحصص", value: totalSessions, color: "#14b8a6", bg: "rgba(20,184,166,0.08)" },
          { label: "إجمالي الحضور", value: totalPresent, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
          { label: "إجمالي الغياب",  value: totalAbsent,  color: totalAbsent > 0 ? "#ef4444" : "#64748b", bg: totalAbsent > 0 ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            padding: "1rem 1.25rem", borderRadius: "14px",
            background: bg, border: `1px solid ${color}22`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* نسبة الحضور الكلية */}
      <div style={{
        padding: "0.85rem 1.25rem", borderRadius: "12px",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: "1rem",
      }}>
        <TbCalendarStats size={18} color="var(--color-teal)" />
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>نسبة الحضور الإجمالية</span>
        <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "3px",
            width: `${overallPct}%`,
            background: overallPct >= 75 ? "#10b981" : overallPct >= 50 ? "#f59e0b" : "#ef4444",
            transition: "width 0.5s ease",
          }} />
        </div>
        <span style={{
          fontSize: "0.9rem", fontWeight: 700, minWidth: "40px", textAlign: "left",
          color: overallPct >= 75 ? "#10b981" : overallPct >= 50 ? "#f59e0b" : "#ef4444",
        }}>{overallPct}%</span>
      </div>

      {/* جدول شهري */}
      {summary.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.88rem" }}>
          لا توجد سجلات حضور بعد
        </div>
      ) : (
        <div style={{
          borderRadius: "12px", overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          overflowX: "auto", WebkitOverflowScrolling: "touch",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "center", minWidth: "360px" }}>
            <thead>
              <tr style={{ background: "rgba(8,12,20,0.95)" }}>
                {["الشهر", "حضور", "غياب", "الحصص", "نسبة الحضور"].map((h) => (
                  <th key={h} style={{
                    padding: "0.75rem 1rem", fontWeight: 600, fontSize: "0.72rem",
                    color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.07)",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...summary].reverse().map((m) => {
                const total = m.present + m.absent;
                const pct   = total > 0 ? Math.round((m.present / total) * 100) : 0;
                const pctColor = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
                return (
                  <tr key={`${m.year}-${m.month}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {MONTHS_AR[m.month - 1]} {m.year}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#10b981", fontWeight: 700 }}>{m.present}</td>
                    <td style={{ padding: "0.75rem 1rem", color: m.absent > 0 ? "#ef4444" : "var(--text-muted)", fontWeight: 700 }}>{m.absent}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)" }}>{total}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                        <div style={{ width: "60px", height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pctColor, borderRadius: "3px" }} />
                        </div>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: pctColor, minWidth: "32px" }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
