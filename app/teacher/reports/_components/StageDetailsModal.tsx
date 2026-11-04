"use client";

import { Modal } from "@/components/ui/Modal";
import { GraduationCap, Users, CheckCircle2, AlertCircle } from "lucide-react";
import type { StageRevenueRow, GroupRevenueRow, OutstandingStudentRow } from "../_types/financialTypes";

interface Props {
  stage: StageRevenueRow | null;
  onClose: () => void;
  groups: GroupRevenueRow[];
  outstandingStudents: OutstandingStudentRow[];
}

export function StageDetailsModal({ stage, onClose, groups, outstandingStudents }: Props) {
  if (!stage) return null;

  const stageGroups = groups.filter((g) => g.gradeId === stage.id);
  const stageDebtStudents = outstandingStudents.filter((s) => s.gradeName === stage.name);

  return (
    <Modal
      isOpen={Boolean(stage)}
      onClose={onClose}
      title={`تفاصيل المرحلة: ${stage.name}`}
      maxWidth="700px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Stage Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: 8,
              background: "rgba(20, 184, 166, 0.08)",
              border: "1px solid rgba(20, 184, 166, 0.2)",
            }}
          >
            <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0 }}>المحصل الفعلي</p>
            <p className="monospace" style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-teal)", margin: "0.2rem 0 0" }}>
              {stage.totalCollected.toLocaleString()} ج.م
            </p>
          </div>

          <div
            style={{
              padding: "0.75rem",
              borderRadius: 8,
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0 }}>المتأخرات</p>
            <p className="monospace" style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f87171", margin: "0.2rem 0 0" }}>
              {stage.totalOutstanding.toLocaleString()} ج.م
            </p>
          </div>

          <div
            style={{
              padding: "0.75rem",
              borderRadius: 8,
              background: "rgba(168, 85, 247, 0.08)",
              border: "1px solid rgba(168, 85, 247, 0.2)",
            }}
          >
            <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0 }}>نسبة التحصيل</p>
            <p className="monospace" style={{ fontSize: "1.2rem", fontWeight: 800, color: "#a855f7", margin: "0.2rem 0 0" }}>
              {stage.collectionRate}%
            </p>
          </div>
        </div>

        {/* Groups in this stage */}
        <div>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Users size={15} style={{ color: "var(--color-teal)" }} />
            <span>المجموعات التابعة للمرحلة ({stageGroups.length})</span>
          </h4>
          {stageGroups.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>لا توجد مجموعات مسجلة لهذه المرحلة</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "180px", overflowY: "auto" }}>
              {stageGroups.map((grp) => (
                <div
                  key={grp.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0.75rem",
                    borderRadius: 6,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-color)",
                    fontSize: "0.82rem",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{grp.name}</span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginRight: "0.5rem" }}>
                      ({grp.paidStudents} من {grp.totalStudents} مسددين)
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span className="monospace" style={{ color: "var(--color-teal)", fontWeight: 700 }}>
                      {grp.totalCollected.toLocaleString()} ج.م
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      ({grp.collectionRate}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue students in this stage */}
        <div>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <AlertCircle size={15} style={{ color: "#f87171" }} />
            <span>طلاب عليهم متأخرات في هذه المرحلة ({stageDebtStudents.length})</span>
          </h4>
          {stageDebtStudents.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "#10b981", margin: 0 }}>
              🎉 لا توجد متأخرات على طلاب هذه المرحلة!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "200px", overflowY: "auto" }}>
              {stageDebtStudents.map((st) => (
                <div
                  key={st.studentId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0.75rem",
                    borderRadius: 6,
                    background: "rgba(239, 68, 68, 0.04)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    fontSize: "0.82rem",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{st.studentName}</span>
                    {st.studentCode && (
                      <span className="monospace" style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginRight: "0.4rem" }}>
                        ({st.studentCode})
                      </span>
                    )}
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                      {st.groupName} · {st.statusLabel}
                    </div>
                  </div>
                  <span className="monospace" style={{ color: "#f87171", fontWeight: 700 }}>
                    {st.remainingBalance.toLocaleString()} ج.م
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
