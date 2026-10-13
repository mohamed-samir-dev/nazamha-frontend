import React from "react";
import { FiUsers, FiCalendar, FiClock, FiTrash2, FiEdit2, FiCheck } from "react-icons/fi";
import { MdOutlineWarningAmber } from "react-icons/md";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { Group, Student, SubTeacher } from "@/lib/types";
import { ARABIC_DAYS, splitDays, formatTimeTo12H } from "@/lib/groupUtils";

export interface GroupCardProps {
  group: Group;
  students: Student[];
  studentCount?: number;
  gradeName?: string;
  subTeacher?: SubTeacher;
  hasCenterMode: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (group: Group) => void;
}

export function GroupCard({
  group, students, studentCount, gradeName, subTeacher, hasCenterMode,
  selected = false, onSelect, onDelete, onEdit,
}: GroupCardProps) {
  const groupStudentCount = studentCount !== undefined
    ? studentCount
    : students.filter((s) => s.group_id === group.id && !s.is_suspended).length;
  const isEmpty = groupStudentCount < 5;

  const cardBorder = selected
    ? "1.5px solid var(--color-teal)"
    : isEmpty
    ? "1px solid rgba(245,158,11,0.35)"
    : "1px solid rgba(255,255,255,0.06)";

  const cardBg = selected
    ? "linear-gradient(135deg, rgba(20,184,166,0.09) 0%, rgba(20,184,166,0.03) 100%)"
    : isEmpty
    ? "rgba(245,158,11,0.04)"
    : "rgba(255,255,255,0.02)";

  return (
    <div
      className={`glass-panel panel-content ${group.is_private ? "group-card-private" : ""}`}
      style={{
        background: cardBg,
        border: cardBorder,
        position: "relative",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: selected ? "0 0 18px rgba(20,184,166,0.12)" : undefined,
      }}
    >
      {/* شريط تحذير المجموعة الفاضية */}
      {isEmpty && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          fontSize: "0.72rem", color: "#f59e0b",
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "6px", padding: "0.25rem 0.6rem", marginBottom: "0.6rem",
        }}>
          <MdOutlineWarningAmber size={13} />
          <span>مجموعة فاضية أو أقل من 5 طلاب</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(group.id)}
              title={selected ? "إلغاء تحديد المجموعة" : "تحديد المجموعة"}
              aria-pressed={selected}
              style={{
                width: "21px",
                height: "21px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                border: selected ? "1.5px solid var(--color-teal)" : "1.5px solid rgba(255,255,255,0.2)",
                background: selected
                  ? "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
                  : "rgba(255,255,255,0.04)",
                color: "#fff",
                boxShadow: selected ? "0 2px 8px rgba(20,184,166,0.35)" : "none",
              }}
            >
              {selected && <FiCheck size={13} strokeWidth={3} />}
            </button>
          )}
          <h3 style={{ fontSize: "1rem", margin: 0, fontWeight: 600, wordBreak: "break-word" }}>{group.name}</h3>
          {group.code && (
            <span style={{
              fontFamily: "monospace", fontSize: "0.7rem", padding: "0.1rem 0.45rem",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "5px", color: "var(--text-muted)", letterSpacing: "0.05em", flexShrink: 0,
            }}>{group.code}</span>
          )}
          {group.is_private && <span className="private-badge">خاصة</span>}
        </div>

        <div style={{ display: "flex", gap: "0.2rem", flexShrink: 0 }}>
          {onEdit && (
            <button className="btn btn-secondary btn-icon" onClick={() => onEdit(group)}
              style={{ border: "none", background: "none", width: "1.75rem", height: "1.75rem", padding: 0 }}
              title="تعديل المجموعة">
              <FiEdit2 size={14} style={{ color: "var(--color-teal)" }} />
            </button>
          )}
          {onDelete && (
            <button className="btn btn-secondary btn-icon" onClick={() => onDelete(group.id)}
              style={{ border: "none", background: "none", width: "1.75rem", height: "1.75rem", padding: 0 }}
              title="حذف المجموعة">
              <FiTrash2 size={14} style={{ color: "var(--color-danger)" }} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
        {hasCenterMode && subTeacher && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-teal)" }}>
            <FiUsers size={13} style={{ flexShrink: 0 }} />
            <span>المعلم: {subTeacher.name}</span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FiCalendar size={13} style={{ flexShrink: 0 }} />
          <span>{splitDays(group.day_of_week).sort((a, b) => ARABIC_DAYS.indexOf(a) - ARABIC_DAYS.indexOf(b)).join("، ")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FiClock size={13} style={{ flexShrink: 0 }} />
          <span>{formatTimeTo12H(group.time)}</span>
        </div>
        {gradeName && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <HiOutlineBookOpen size={14} style={{ flexShrink: 0 }} />
            <span>{gradeName}</span>
          </div>
        )}
        {group.monthly_price != null && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: group.is_private ? "#a78bfa" : "var(--color-teal)" }}>
            <RiMoneyDollarCircleLine size={15} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{group.monthly_price} ج / شهرياً</span>
          </div>
        )}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          marginTop: "0.4rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.45rem",
        }}>
          <FiUsers size={13} style={{ flexShrink: 0, color: isEmpty ? "#f59e0b" : "var(--color-teal)" }} />
          <span style={{ fontWeight: 600, color: isEmpty ? "#f59e0b" : "var(--text-primary)" }}>
            {groupStudentCount} طالب
          </span>
        </div>
      </div>
    </div>
  );
}
