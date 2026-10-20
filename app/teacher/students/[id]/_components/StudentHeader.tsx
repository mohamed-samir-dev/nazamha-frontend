"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getStudentReportLink } from "@/lib/services/studentReportLink";
import { preparePrintInPlace } from "@/lib/printInPlace";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight } from "lucide-react";
import { FiPhone, FiTrash2 } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { MdMenuBook, MdBlock, MdLockOpen } from "react-icons/md";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { RiGroupLine } from "react-icons/ri";
import { TbCalendarStats } from "react-icons/tb";
import { PiCreditCardBold } from "react-icons/pi";
import { Student, Group, Grade, MonthlySubscription } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";
import { StudentsService } from "@/lib/services/studentsService";
import { SuspendModal } from "@/components/features/SuspendModal";

interface Props {
  student: Student;
  group: Group | undefined;
  grade: Grade | undefined;
  subs: MonthlySubscription[];
  onDelete?: () => void;
  onAddPayment?: () => void;
  onStudentUpdate?: (updated: Partial<Student>) => void;
  onNavigateToBooks?: () => void;
}

const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export function StudentHeader({ student, group, grade, subs, onDelete, onAddPayment, onStudentUpdate, onNavigateToBooks }: Props) {
  const [reportLink, setReportLink] = useState("");
  const [reportLinkError, setReportLinkError] = useState(false);
  const preparedReport = useRef<ReturnType<typeof preparePrintInPlace> | null>(null);
  const [printRevision, setPrintRevision] = useState(0);
  const [printing, setPrinting] = useState(false);
  const printInProgress = useRef(false);
  useEffect(() => {
    const invalidate = () => { if (!printInProgress.current) setPrintRevision(value => value + 1); };
    window.addEventListener("financial-data-changed", invalidate);
    window.addEventListener("focus", invalidate);
    return () => {
      window.removeEventListener("financial-data-changed", invalidate);
      window.removeEventListener("focus", invalidate);
    };
  }, []);
  useEffect(() => {
    if (!reportLink) return;
    const prepared = preparePrintInPlace({ url: reportLink, readySelector: ".report-sheet" });
    preparedReport.current = prepared;
    return () => { prepared.dispose(); if (preparedReport.current === prepared) preparedReport.current = null; };
  }, [reportLink, student, subs, printRevision]);
  useEffect(() => {
    let active = true;
    setReportLink(""); setReportLinkError(false);
    getStudentReportLink(student.id).then(link => { if (active) setReportLink(link); }).catch(() => { if (active) setReportLinkError(true); });
    return () => { active = false; };
  }, [student.id]);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const isSuspended = student.is_suspended === true && (
    !student.suspended_until || new Date(student.suspended_until) > new Date()
  );

  // رفع الإيقاف تلقائياً لو انتهت مدته
  useEffect(() => {
    if (student.is_suspended && student.suspended_until && new Date(student.suspended_until) <= new Date()) {
      StudentsService.unsuspendStudent(student.id).then((updated) => onStudentUpdate?.(updated)).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  const handleSuspend = async (suspended_until: string | undefined, reason: string) => {
    setSuspendLoading(true);
    try {
      const updated = await StudentsService.suspendStudent(student.id, suspended_until, reason || undefined);
      onStudentUpdate?.(updated);
      setShowSuspendModal(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "تعذر إيقاف الطالب");
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    try {
      const updated = await StudentsService.unsuspendStudent(student.id);
      onStudentUpdate?.(updated);
    } catch (error) { window.alert(error instanceof Error ? error.message : "تعذر رفع الإيقاف"); }
  };

const dueSubs = subs.filter((s) => s.status !== "not_due");
  const paidSubs = subs.filter((s) => s.status === "paid" || s.status === "exempt");
  const totalDue = dueSubs.length;
  const totalPaid = paidSubs.length;
  const percent = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
  const statColor = percent >= 80 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#ef4444";

  const lastPaid = subs
    .filter((s) => s.status === "paid" || s.status === "exempt")
    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)[0];

  const joinDate = student.created_at
    ? new Date(student.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", timeZone: "Africa/Cairo" })
    : "—";

  const handleWhatsApp = () => {
    if (!student.parent_phone) return;
    const digits = student.parent_phone.replace(/\D/g, "");
    const phone = /^01\d{9}$/.test(digits) ? `20${digits.slice(1)}` : digits.replace(/^00/, "");
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
  };

  const handleCall = () => {
    if (!student.parent_phone) return;
    window.location.href = `tel:${student.parent_phone}`;
  };


  const quickActions = [
    { icon: <FiPhone size={15} />,     label: "اتصال",        color: "#a5b4fc", bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.25)", onClick: handleCall,         disabled: !student.parent_phone },
    { icon: <FaWhatsapp size={16} />,  label: "واتساب",       color: "#25D366", bg: "rgba(37,211,102,0.1)", border: "rgba(37,211,102,0.25)", onClick: handleWhatsApp,     disabled: !student.parent_phone },
    { icon: <MdMenuBook size={16} />,  label: "عرض الكتب",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)", onClick: onNavigateToBooks,  disabled: false },
    isSuspended
      ? { icon: <MdLockOpen size={16} />, label: "رفع الإيقاف", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", onClick: handleUnsuspend, disabled: false }
      : { icon: <MdBlock size={16} />,    label: "إيقاف الطالب", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", onClick: () => setShowSuspendModal(true), disabled: false },
  ];

  return (
    <div style={{ marginBottom: "2rem" }}>
      {/* Top nav */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <Link href="/teacher/students" style={{ textDecoration: "none" }}>
          <Button variant="secondary" size="sm" leftIcon={<ArrowRight size={16} />}>رجوع</Button>
        </Link>
        <div style={{ marginRight: "auto", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button variant="secondary" size="sm" disabled={!reportLink || printing} onClick={async () => {
            setPrinting(true);
            printInProgress.current = true;
            try {
              const prepared = preparedReport.current ?? preparePrintInPlace({ url: reportLink, readySelector: ".report-sheet" });
              await prepared.print();
            } catch (error) { window.alert(error instanceof Error ? error.message : "تعذر تجهيز التقرير للطباعة."); }
            finally { preparedReport.current = null; printInProgress.current = false; setPrinting(false); }
          }}>{printing ? "جاري تجهيز الطباعة…" : "طباعة التقرير الشهري"}</Button>
          {onDelete && (
            <Button variant="secondary" size="sm" leftIcon={<FiTrash2 size={15} />} onClick={onDelete}
              style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.25)", color: "#ef4444" }}>
              حذف
            </Button>
          )}
        </div>
      </div>

      {/* Hero card */}
      <div className="glass-panel student-hero-card" style={{
        background: "linear-gradient(135deg, rgba(20,184,166,0.07) 0%, rgba(59,130,246,0.04) 50%, rgba(99,102,241,0.04) 100%)",
        borderColor: "rgba(20,184,166,0.18)",
        padding: "1.25rem",
      }}>

        {/* Row 1: QR + Info + Payment */}
        <div className="student-hero-top">

          {/* QR Code */}
          <div className="student-hero-qr" style={{ width: 156, height: "auto", minWidth: 156, flexDirection: "column", padding: 10, gap: 4 }}>
            {reportLink ? <QRCodeSVG
              value={
                reportLink
              }
              size={132}
              level="M"
              marginSize={4}
              style={{ flexShrink: 0 }}
            /> : <span role="status">{reportLinkError ? "تعذر تحميل رابط التقرير" : "جاري تجهيز التقرير…"}</span>}
            <small style={{ display: "block", fontSize: 10, marginTop: 6, color: "#334155", textAlign: "center" }}>تقرير الشهر · الرابط صالح 7 أيام</small>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + status */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.45rem" }}>
              <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.7rem)", margin: 0, fontWeight: 700, lineHeight: 1.2 }}>{student.name}</h1>
              {isSuspended ? (
                <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", whiteSpace: "nowrap" }}>
                  ● موقوف{student.suspended_until ? ` حتى ${new Date(student.suspended_until).toLocaleDateString("ar-EG")}` : ""}
                </span>
              ) : (
                <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", whiteSpace: "nowrap" }}>● نشط</span>
              )}
            </div>

            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.65rem" }}>
              {(student.center_student_code || student.code) && (
                <span style={{ fontFamily: "monospace", fontSize: "0.78rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.22)", color: "var(--color-teal)" }}>
                  #{student.center_student_code || student.code}
                </span>
              )}
              {grade && (
                <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.78rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)", color: "#a5b4fc" }}>
                  <HiOutlineAcademicCap size={12} /> {grade.name}
                </span>
              )}
              {group && (
                <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.78rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.22)", color: "#93c5fd" }}>
                  <RiGroupLine size={12} /> {group.name}
                </span>
              )}
              {student.parent_phone && (
                <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.78rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}>
                  <FiPhone size={11} /> {student.parent_phone}
                </span>
              )}
            </div>

            {/* Meta row */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <TbCalendarStats size={13} /> انضم: {joinDate}
              </span>
              {lastPaid && (
                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <PiCreditCardBold size={13} /> آخر دفعة: {arabicMonths[lastPaid.month - 1]} {lastPaid.year}
                </span>
              )}
              {student.subscription_start_month && (
                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <TbCalendarStats size={13} /> بداية: {arabicMonths[student.subscription_start_month - 1]} {student.subscription_start_year}
                </span>
              )}
            </div>
          </div>

          {/* Payment summary — hidden on mobile, shown inline on desktop */}
          <div className="student-hero-payment">
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: statColor, lineHeight: 1 }}>
              {totalPaid}<span style={{ fontSize: "0.95rem", color: "var(--text-muted)", fontWeight: 400 }}>/{totalDue}</span>
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: "0.25rem 0" }}>شهر مدفوع</div>
            <div style={{ width: "100%", height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${percent}%`, background: statColor, borderRadius: "3px", transition: "width 0.6s ease" }} />
            </div>
            <div style={{ fontSize: "0.65rem", color: statColor, marginTop: "0.25rem", fontWeight: 700 }}>{percent}% التزام</div>
          </div>
        </div>

        {/* Payment summary — mobile only (full width bar) */}
        <div className="student-hero-payment-mobile">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>الالتزام المالي</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: statColor }}>
              {totalPaid}/{totalDue} شهر · {percent}%
            </span>
          </div>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${percent}%`, background: statColor, borderRadius: "3px", transition: "width 0.6s ease" }} />
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="student-hero-actions">
          {quickActions.map(({ icon, label, color, bg, border, onClick, disabled }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={disabled}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                padding: "0.5rem 0.9rem", borderRadius: "10px",
                background: bg, border: `1px solid ${border}`, color,
                cursor: disabled ? "not-allowed" : "pointer",
                fontSize: "0.82rem", fontWeight: 600,
                opacity: disabled ? 0.4 : 1,
                transition: "all 0.2s ease",
                fontFamily: "inherit",
                flex: "1 1 auto",
                minWidth: "fit-content",
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {showSuspendModal && (
        <SuspendModal
          studentName={student.name}
          onConfirm={handleSuspend}
          onClose={() => setShowSuspendModal(false)}
          loading={suspendLoading}
        />
      )}
    </div>
  );
}
