"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Trash2, CheckSquare, Square, User, Users, BookOpen } from "lucide-react";
import { MdBlock, MdLockOpen } from "react-icons/md";
import { Student, Group, BookDef, Grade, MonthlySubscription, SubscriptionStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";
import { StudentsService } from "@/lib/services/studentsService";
import { SuspendModal } from "@/components/features/SuspendModal";

const formatTimeTo12H = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

// حساب الشهر والسنة الحاليين عند كل render للـ component — ليس module-level
function getCurrentMonthYear() {
  const now = new Date();
  return { currentMonth: now.getMonth() + 1, currentYear: now.getFullYear() };
}

export interface StudentTableRowProps {
  student: Student;
  groups: Group[];
  grades: Grade[];
  teacherBooks: BookDef[];
  isSelected: boolean;
  subsOverride?: MonthlySubscription[];
  subsLoading?: boolean;
  purchasedBooksCount?: number;
  purchasedBookIds?: string[];
  onToggleSelect: (id: string) => void;
  onToggleMonth?: (student: Student, monthIndex: number) => void;
  onToggleBook: (student: Student, bookId: string) => void;
  onDelete: (id: string) => void;
  onUpdateGroup: (id: string, groupId: string) => void;
  onEdit?: (student: Student) => void;
  onStudentUpdate?: (studentId: string, updated: Partial<Student>) => void;
  onSubsChanged?: (studentId: string, subs: MonthlySubscription[]) => void;
}

export const StudentTableRow = React.memo(function StudentTableRow({
  student, groups, grades, teacherBooks,
  isSelected, subsOverride, subsLoading, purchasedBooksCount = 0, purchasedBookIds, onToggleSelect, onToggleBook, onDelete, onUpdateGroup, onStudentUpdate, onSubsChanged,
}: StudentTableRowProps) {
  const { currentMonth, currentYear } = useMemo(() => getCurrentMonthYear(), []);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [showFamilyPopup, setShowFamilyPopup] = useState(false);
  const [families, setFamilies] = useState<{ familyId: string; members: Student[]; discount?: number | null }[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(false);
  const [addingToFamily, setAddingToFamily] = useState<string | null>(null);
  const [transferConfirm, setTransferConfirm] = useState<{ familyId: string; familyName: string; discount: number | null } | null>(null);

  const getFamilyName = (family: { familyId: string; familyName?: string; members: Student[]; discount?: number | null }) => {
    if (family.familyName) return family.familyName;
    const anyName = family.members.find((m) => m.sibling_family_name)?.sibling_family_name;
    if (anyName) return anyName;
    const parts = family.members[0]?.name?.trim().split(/\s+/) || [];
    return `عائلة ${parts[1] || parts[0] || ""}`;
  };

  const handleOpenFamilyPopup = async () => {
    setShowFamilyPopup(true);
    setFamiliesLoading(true);
    try {
      const fams = await StudentsService.getSiblings();
      setFamilies(fams.map((f) => ({
        ...f,
        discount: f.members.find((m) => m.family_discount_percent)?.family_discount_percent ?? null,
      })));
    } finally {
      setFamiliesLoading(false);
    }
  };

  const handleAddToFamily = async (familyId: string) => {
    const family = families.find((f) => f.familyId === familyId);
    const familyName = family ? getFamilyName(family) : "";
    const discount = family?.discount ?? null;

    // لو الطالب في عائلة (سواء نفسها أو مختلفة) نعرض تأكيد
    if (student.sibling_family_id) {
      if (student.sibling_family_id === familyId) return; // نفس العائلة، مفيش حاجة
      setTransferConfirm({ familyId, familyName, discount });
      return;
    }
    // مش في عائلة — نعرض رسالة تأكيد بالخصومات
    setTransferConfirm({ familyId, familyName, discount });
  };

  const doAddToFamily = async (familyId: string) => {
    setAddingToFamily(familyId);
    try {
      await StudentsService.transferFamily(student.id, familyId);
      const family = families.find((f) => f.familyId === familyId);
      onStudentUpdate?.(student.id, {
        sibling_family_id: familyId,
        sibling_family_name: family ? getFamilyName(family) : undefined,
        family_discount_percent: family?.discount ?? null,
      });
      setShowFamilyPopup(false);
      setTransferConfirm(null);
    } finally {
      setAddingToFamily(null);
    }
  };

  const isSuspended = student.is_suspended && (!student.suspended_until || new Date(student.suspended_until) > new Date());

  const handleSuspend = useCallback(async (suspended_until: string | undefined, reason: string) => {
    setSuspendLoading(true);
    try {
      const updated = await StudentsService.suspendStudent(student.id, suspended_until, reason || undefined);
      onStudentUpdate?.(student.id, updated);
      setShowSuspendModal(false);
    } finally {
      setSuspendLoading(false);
    }
  }, [student.id, onStudentUpdate]);

  const handleUnsuspend = useCallback(async () => {
    const updated = await StudentsService.unsuspendStudent(student.id);
    onStudentUpdate?.(student.id, updated);
  }, [student.id, onStudentUpdate]);
  const gradeGroups = useMemo(
    () => groups.filter((g) => !student.grade_id || g.grade_id === student.grade_id),
    [groups, student.grade_id]
  );
  const grade = useMemo(
    () => grades.find((g) => g.id === (student.grade_id || groups.find((gr) => gr.id === student.group_id)?.grade_id)),
    [grades, groups, student.grade_id, student.group_id]
  );
  const gradeBooksForStudent = useMemo(
    () => teacherBooks.filter((b) => !b.grade_id || b.grade_id === student.grade_id),
    [teacherBooks, student.grade_id]
  );
  const totalBooksForGrade = gradeBooksForStudent.length;
  const gradeBookIds = useMemo(() => new Set(gradeBooksForStudent.map((b) => b.id)), [gradeBooksForStudent]);
  const receivedGradeBooks = useMemo(
    () => (purchasedBookIds ?? []).filter((id) => gradeBookIds.has(id)).length,
    [purchasedBookIds, gradeBookIds]
  );

  const [subs, setSubs] = useState<MonthlySubscription[]>(() => subsOverride ?? []);
  const locallyUpdated = React.useRef(false);
  const prevSubsOverrideRef = React.useRef<MonthlySubscription[] | undefined>(subsOverride);

  useEffect(() => {
    // لو subsOverride اتغير فعلاً (deep comparison of length and statuses)
    if (subsOverride !== undefined) {
      const hasChanged = !prevSubsOverrideRef.current || 
        subsOverride.length !== prevSubsOverrideRef.current.length ||
        subsOverride.some((sub, i) => {
          const prev = prevSubsOverrideRef.current?.[i];
          return !prev || prev.status !== sub.status || prev.id !== sub.id;
        });
      
      if (hasChanged) {
        setSubs(subsOverride);
        prevSubsOverrideRef.current = subsOverride;
        locallyUpdated.current = false;
      } else if (locallyUpdated.current) {
        locallyUpdated.current = false;
      }
    }
  }, [subsOverride]);

  const dueSubs = subs.filter((s) => s.status !== "not_due");
  const allVisibleSubs = subs; // show all including not_due so user can toggle them
  const paidCount = dueSubs.filter((s) => s.status === "paid" || s.status === "exempt").length;
  const totalDue = dueSubs.length;
  const pct = totalDue > 0 ? Math.round((paidCount / totalDue) * 100) : 0;

  const cycleStatus = useCallback((sub: MonthlySubscription) => {
    if (!sub.id) return;
    const next: SubscriptionStatus =
      sub.status === "not_due" ? "due"
      : sub.status === "due" ? "paid"
      : sub.status === "paid" ? "exempt"
      : "due";
    const updates: Partial<MonthlySubscription> = { status: next, paid_at: next === "paid" ? new Date().toISOString() : null };
    const newSubs = subs.map((s) => s.id === sub.id ? { ...s, ...updates } : s);
    locallyUpdated.current = true;
    setSubs(newSubs);
    onSubsChanged?.(student.id, newSubs);
    SubscriptionsService.updateSubscription(sub.id, updates)
      .then(() => {
        // لو دفع أو معفي — تحقق لو الإيقاف اتفك تلقائياً
        if ((next === "paid" || next === "exempt") && student.is_suspended) {
          StudentsService.checkSuspension(student.id).then((status) => {
            if (!status.is_suspended) onStudentUpdate?.(student.id, { is_suspended: false, suspended_until: null, suspension_reason: null });
          }).catch(() => {});
        }
      })
      .catch((err) => {
        console.error("[cycleStatus] failed to update sub", sub.id, err?.message);
        locallyUpdated.current = true;
        setSubs((prev) => prev.map((s) => s.id === sub.id ? sub : s));
        onSubsChanged?.(student.id, subs);
      });
  }, [subs, student.id, student.is_suspended, onSubsChanged, onStudentUpdate]);

  const getSubColor = useCallback((status: SubscriptionStatus, subMonth: number, subYear: number) => {
    if (status === "paid")   return { bg: "rgba(16,185,129,0.25)", color: "#10b981", border: "rgba(16,185,129,0.5)" };
    if (status === "exempt") return { bg: "rgba(245,158,11,0.2)",  color: "#f59e0b", border: "rgba(245,158,11,0.4)" };
    // due or not_due
    const isPastOrCurrent = subYear < currentYear || (subYear === currentYear && subMonth <= currentMonth);
    if (isPastOrCurrent)    return { bg: "rgba(239,68,68,0.2)",   color: "#ef4444", border: "rgba(239,68,68,0.6)" };
    return { bg: "rgba(255,255,255,0.04)", color: "var(--text-muted)", border: "rgba(255,255,255,0.1)" };
  }, [currentMonth, currentYear]);

  return (
    <>
    <tr className={`student-row${isSelected ? " row-selected" : ""}`}>
      {/* Checkbox */}
      <td className="td-check" style={{ textAlign: "center", width: "44px", padding: "0.75rem 0.5rem" }}>
        <button onClick={() => onToggleSelect(student.id)} className="row-check-btn">
          {isSelected ? <CheckSquare size={17} className="color-teal" /> : <Square size={17} />}
        </button>
      </td>

      {/* Code */}
      <td data-label="الكود" style={{ textAlign: "center", padding: "0.75rem 0.75rem" }}>
        <span className="student-code-badge">
          {student.center_student_code || student.code || "—"}
        </span>
      </td>

      {/* Grade */}
      <td data-label="السنة" style={{ textAlign: "center", padding: "0.75rem 0.75rem" }}>
        {grade ? <span className="grade-badge">{grade.name}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}
      </td>

      {/* Name */}
      <td data-label="الاسم" style={{ padding: "0.75rem 1rem" }}>
        <Link href={`/teacher/students/${student.id}`} style={{ textDecoration: "none" }}>
          <span className="student-name-text" style={{ fontSize: "0.9rem", cursor: "pointer" }}>{student.name}</span>
        </Link>
      </td>

      {/* Group */}
      <td data-label="المجموعة" style={{ textAlign: "center", padding: "0.75rem 0.75rem" }}>
        <select
          className="form-input group-select"
          value={student.group_id || ""}
          onChange={(e) => { if (e.target.value === "" || /^[a-f\d]{24}$/i.test(e.target.value)) onUpdateGroup(student.id, e.target.value); }}
        >
          <option key="no-group" value="" style={{ background: "#0f172a" }}>بدون مجموعة</option>
          {gradeGroups.map((g, i) => (
            <option key={g.id ?? i} value={g.id ?? ""} style={{ background: "#0f172a" }}>
              {g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})
            </option>
          ))}
        </select>
      </td>

      {/* Months */}
      <td data-label="الأشهر" style={{ textAlign: "center", padding: "0.75rem 0.75rem" }}>
        {subsLoading ? (
          <div style={{ display: "flex", gap: "3px", justifyContent: "center" }}>
            {[...Array(9)].map((_, i) => (
              <div key={i} style={{ width: "32px", height: "32px", borderRadius: "7px", background: "rgba(255,255,255,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : dueSubs.length === 0 ? (
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>—</span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
            <div style={{ display: "flex", flexWrap: "nowrap", gap: "3px", justifyContent: "center" }}>
              {allVisibleSubs.map((sub, idx) => {
                const isCurrent = sub.month === currentMonth && sub.year === currentYear;
                const c = getSubColor(sub.status, sub.month, sub.year);
                const label = sub.status === "paid" ? "مدفوع" : sub.status === "exempt" ? "معفي" : sub.status === "due" ? "مستحق" : "غير مستحق";
                return (
                  <button
                    key={sub.id ?? `${sub.month}-${sub.year}-${idx}`}
                    onClick={() => cycleStatus(sub)}
                    title={`${sub.month}/${sub.year} — ${label}`}
                    style={{
                      width: "32px", height: "32px",
                      borderRadius: "7px",
                      border: `1.5px solid ${c.border}`,
                      background: c.bg,
                      color: c.color,
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      fontWeight: isCurrent ? 800 : 600,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      outline: isCurrent ? `2px solid ${c.color}` : "none",
                      outlineOffset: "2px",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {sub.month}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "72px", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444", borderRadius: "99px", transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, fontFamily: "monospace" }}>{paidCount}/{totalDue}</span>
            </div>
          </div>
        )}
      </td>

      {/* Subscription Price */}
      <td data-label="الاشتراك" style={{ textAlign: "center", padding: "0.75rem 0.75rem" }}>
        {(() => {
          const firstDue = subs.find((s) => s.status !== "not_due");
          if (!firstDue) return <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>;
          const net = firstDue.amount - (firstDue.discount || 0);
          return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#10b981" }}>{net} ج</span>
              {firstDue.discount > 0 && (
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textDecoration: "line-through" }}>{firstDue.amount} ج</span>
              )}
            </div>
          );
        })()}
      </td>

      {/* Books */}
      <td data-label="الكتب" style={{ textAlign: "center", padding: "0.75rem 0.75rem" }}>
        {totalBooksForGrade === 0 ? (
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <BookOpen size={14} style={{ color: receivedGradeBooks === totalBooksForGrade ? "#10b981" : receivedGradeBooks > 0 ? "#f59e0b" : "var(--text-muted)", flexShrink: 0 }} />
            <span style={{
              fontSize: "0.85rem", fontWeight: 700,
              color: receivedGradeBooks === totalBooksForGrade ? "#10b981" : receivedGradeBooks > 0 ? "#f59e0b" : "var(--text-muted)",
            }}>
              {receivedGradeBooks}/{totalBooksForGrade}
            </span>
          </div>
        )}
      </td>

      {/* Actions */}
      <td data-label="إجراءات" style={{ textAlign: "center", padding: "0.75rem 0.75rem" }}>
        <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
          <Link href={`/teacher/students/${student.id}`} style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="sm" title="ملف الطالب" style={{ border: "none", background: "rgba(59,130,246,0.1)", borderRadius: "8px" }}>
              <User size={14} className="color-primary" />
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => onDelete(student.id)} title="حذف الطالب" style={{ border: "none", background: "rgba(239,68,68,0.1)", borderRadius: "8px" }}>
            <Trash2 size={14} className="color-danger" />
          </Button>
          {isSuspended ? (
            <Button variant="secondary" size="sm" onClick={handleUnsuspend} title="رفع الإيقاف" style={{ border: "none", background: "rgba(16,185,129,0.1)", borderRadius: "8px" }}>
              <MdLockOpen size={14} color="#10b981" />
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setShowSuspendModal(true)} title="إيقاف الطالب" style={{ border: "none", background: "rgba(239,68,68,0.08)", borderRadius: "8px" }}>
              <MdBlock size={14} color="#ef4444" />
            </Button>
          )}
          <Button
            variant="secondary" size="sm"
            onClick={handleOpenFamilyPopup}
            title="إضافة لعائلة"
            style={{ border: "none", background: "rgba(251,191,36,0.1)", borderRadius: "8px" }}
          >
            <Users size={14} style={{ color: "#fbbf24" }} />
          </Button>
        </div>
      </td>
    </tr>
    {showFamilyPopup && createPortal(
      <div
        className="modal-overlay"
        onClick={() => setShowFamilyPopup(false)}
        style={{ zIndex: 9999 }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--bg-card, #1e293b)",
            border: "1px solid rgba(251,191,36,0.3)",
            borderRadius: "16px",
            padding: "20px",
            width: "320px",
            maxHeight: "400px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={16} style={{ color: "#fbbf24" }} />
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fbbf24" }}>إضافة لعائلة</span>
            </div>
            <button
              onClick={() => setShowFamilyPopup(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem", lineHeight: 1, padding: "2px 6px" }}
            >×</button>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "12px", margin: "0 0 12px" }}>
            طالب: <strong style={{ color: "#fff" }}>{student.name}</strong>
          </p>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {familiesLoading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>جاري التحميل...</div>
            ) : families.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>لا توجد عائلات بعد</div>
            ) : (
              families.map((fam) => {
                const isCurrentFamily = student.sibling_family_id === fam.familyId;
                return (
                <button
                  key={fam.familyId}
                  onClick={() => !isCurrentFamily && handleAddToFamily(fam.familyId)}
                  disabled={!!addingToFamily || isCurrentFamily}
                  style={{
                    width: "100%", textAlign: "right", padding: "10px 14px",
                    borderRadius: "10px",
                    border: isCurrentFamily ? "1px solid rgba(20,184,166,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    background: isCurrentFamily ? "rgba(20,184,166,0.1)" : addingToFamily === fam.familyId ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.03)",
                    color: "#fff", cursor: isCurrentFamily ? "default" : addingToFamily ? "not-allowed" : "pointer",
                    marginBottom: "8px", display: "flex", alignItems: "center",
                    justifyContent: "space-between", transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "right" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{getFamilyName(fam)}</span>
                    <span style={{ fontSize: "0.75rem", color: isCurrentFamily ? "#14b8a6" : "var(--text-muted)" }}>
                      {isCurrentFamily ? "✓ عائلته الحالية" : `${fam.members.length} أبناء`}
                    </span>
                  </div>
                  {addingToFamily === fam.familyId && (
                    <span style={{ width: "14px", height: "14px", border: "2px solid #14b8a6", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                  )}
                </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    , document.body)}
    {showSuspendModal && createPortal(
      <SuspendModal
        studentName={student.name}
        onConfirm={handleSuspend}
        onClose={() => setShowSuspendModal(false)}
        loading={suspendLoading}
      />
    , document.body)}
    {transferConfirm && createPortal(
      <div className="modal-overlay" onClick={() => setTransferConfirm(null)} style={{ zIndex: 10000 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-card, #1e293b)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "16px", padding: "20px", width: "340px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Users size={16} style={{ color: "#fbbf24" }} />
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fbbf24" }}>
              {student.sibling_family_id ? "نقل الطالب لعائلة جديدة" : "إضافة لعائلة"}
            </span>
          </div>

          {student.sibling_family_id ? (
            // حالة النقل من عائلة لعائلة
            <>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "8px" }}>
                الطالب <strong style={{ color: "#fff" }}>{student.name}</strong> موجود بالفعل في عائلة.
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "8px" }}>
                هل تريد نقله إلى <strong style={{ color: "#fbbf24" }}>{transferConfirm.familyName}</strong>؟
              </p>
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", color: "#f87171", marginBottom: transferConfirm.discount ? "8px" : "16px" }}>
                ⚠ سيتم فصله عن عائلته الحالية وستتغير خصوماته
              </div>
              {transferConfirm.discount ? (
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", color: "#10b981", marginBottom: "16px" }}>
                  ✓ سيتطبق عليه خصم العائلة الجديدة ({transferConfirm.discount}%)
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                  ℹ العائلة الجديدة ليس لها خصم حالياً
                </div>
              )}
            </>
          ) : (
            // حالة الإضافة لعائلة (مش في عائلة)
            <>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "8px" }}>
                سيتم إضافة <strong style={{ color: "#fff" }}>{student.name}</strong> إلى <strong style={{ color: "#fbbf24" }}>{transferConfirm.familyName}</strong>.
              </p>
              {transferConfirm.discount ? (
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", color: "#10b981", marginBottom: "16px" }}>
                  ✓ سيتطبق عليه خصم العائلة ({transferConfirm.discount}%) ويؤثر على اشتراكاته
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                  ℹ العائلة ليس لها خصم حالياً — لو أضيفت خصم لاحقاً سيتطبق عليه تلقائياً
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={() => setTransferConfirm(null)} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.85rem" }}>إلغاء</button>
            <button onClick={() => doAddToFamily(transferConfirm.familyId)} disabled={!!addingToFamily} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: "#fbbf24", color: "#000", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
              {addingToFamily ? "جاري..." : student.sibling_family_id ? "تأكيد النقل" : "تأكيد الإضافة"}
            </button>
          </div>
        </div>
      </div>
    , document.body)}
    </>
  );
});
