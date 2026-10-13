"use client";

import { useState } from "react";
import { Users, Link2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Student } from "@/lib/types";
import { StudentsService } from "@/lib/services/studentsService";

interface PotentialGroup {
  key: string;
  reason: string;
  members: Student[];
}

interface Props {
  potentials: PotentialGroup[];
  onLinked: (studentIds: string[], familyId: string) => void;
  onDismiss: (key: string) => void;
}

export function PotentialSiblingsAlert({ potentials, onLinked, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [linkedKeys, setLinkedKeys] = useState<Set<string>>(new Set());

  if (potentials.length === 0) return null;

  const visible = potentials.filter((p) => !linkedKeys.has(p.key));
  if (visible.length === 0) return null;

  const handleLink = async (group: PotentialGroup) => {
    setLoadingKey(group.key);
    try {
      const ids = group.members.map((m) => m.id);
      // Build family name from father's name (2nd word of first member)
      const parts = group.members[0]?.name?.trim().split(/\s+/) || [];
      const fatherName = parts[1] || parts[0] || "";
      const autoFamilyName = `\u0639\u0627\u0626\u0644\u0629 ${fatherName}`;
      const res = await StudentsService.linkSiblings(ids, autoFamilyName);
      setLinkedKeys((prev) => new Set([...prev, group.key]));
      onLinked(ids, res.familyId);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div style={{
      borderRadius: "12px",
      border: "1px solid rgba(251,191,36,0.3)",
      background: "rgba(251,191,36,0.05)",
      overflow: "hidden",
      marginBottom: "1.25rem",
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: "rgba(251,191,36,0.1)",
          border: "none", cursor: "pointer", borderBottom: expanded ? "1px solid rgba(251,191,36,0.2)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: "rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users size={14} style={{ color: "#fbbf24" }} />
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fbbf24", margin: 0 }}>
              تم اكتشاف {visible.length} {visible.length === 1 ? "مجموعة" : "مجموعات"} أخوات محتملة
            </p>
            <p style={{ fontSize: "0.75rem", color: "rgba(251,191,36,0.7)", margin: 0 }}>
              طلاب يشتركون في نفس رقم ولي الأمر — اضغط لربطهم كأخوات
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} style={{ color: "#fbbf24" }} /> : <ChevronDown size={16} style={{ color: "#fbbf24" }} />}
      </button>

      {/* Groups */}
      {expanded && (
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {visible.map((group) => {
            const isLoading = loadingKey === group.key;
            return (
              <div key={group.key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: "10px",
                padding: "10px 14px", borderRadius: "10px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                {/* Members */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      📞 {group.key}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {group.members.map((m, mi) => (
                      <span key={m.id || mi} style={{
                        display: "flex", alignItems: "center", gap: "5px",
                        padding: "3px 10px", borderRadius: "20px",
                        background: "rgba(251,191,36,0.12)",
                        border: "1px solid rgba(251,191,36,0.25)",
                        fontSize: "0.82rem", color: "#fde68a", fontWeight: 500,
                      }}>
                        {m.name}
                        {m.code && (
                          <span style={{
                            fontFamily: "monospace", fontSize: "0.7rem",
                            background: "rgba(20,184,166,0.15)", color: "#14b8a6",
                            border: "1px solid rgba(20,184,166,0.25)",
                            padding: "0px 5px", borderRadius: "4px",
                          }}>{m.code}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => handleLink(group)}
                    disabled={isLoading}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "7px 14px", borderRadius: "8px",
                      background: isLoading ? "rgba(20,184,166,0.1)" : "rgba(20,184,166,0.15)",
                      border: "1px solid rgba(20,184,166,0.4)",
                      color: "#14b8a6", fontSize: "0.82rem", fontWeight: 600,
                      cursor: isLoading ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {isLoading ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ width: "12px", height: "12px", border: "2px solid #14b8a6", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                        جاري الربط...
                      </span>
                    ) : (
                      <><Link2 size={13} /> ربط كأخوات</>
                    )}
                  </button>
                  <button
                    onClick={() => onDismiss(group.key)}
                    style={{
                      width: "28px", height: "28px", borderRadius: "6px",
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--text-muted)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title="تجاهل"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
