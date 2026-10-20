"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, MinusCircle, Gift } from "lucide-react";
import { MonthlySubscription, SubscriptionStatus } from "@/lib/types";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";

const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  not_due: { label: "غير مستحق", color: "#64748b", bg: "rgba(100,116,139,0.1)", icon: <MinusCircle size={12} /> },
  due:     { label: "مستحق",     color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: <XCircle size={12} /> },
  paid:    { label: "مدفوع",     color: "#10b981", bg: "rgba(16,185,129,0.15)", icon: <CheckCircle size={12} /> },
  exempt:  { label: "معفى",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: <Gift size={12} /> },
};

const getId = (sub: MonthlySubscription) => sub.id || sub._id || "";

interface Props {
  studentId: string;
  /** Optional: pass already-fetched subscriptions from the parent to skip the
   *  duplicate GET /subscriptions/student/:id that would otherwise fire. When
   *  omitted the component self-fetches (standalone / deep-link usage). */
  initialSubs?: MonthlySubscription[];
  onChanged?: (subs: MonthlySubscription[]) => void;
}

export function StudentPaymentCard({ studentId, initialSubs, onChanged }: Props) {
  const [subs, setSubs] = useState<MonthlySubscription[]>(() => initialSubs ?? []);
  const [loading, setLoading] = useState(!initialSubs);
  const [error, setError] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    // When initialSubs is provided, loading was already initialised to false
    // via useState(!initialSubs), so nothing to do here.
    if (initialSubs) { setSubs(initialSubs); setLoading(false); return; }
    if (!studentId) return;
    SubscriptionsService.getStudentSubscriptions(studentId)
      .then(setSubs)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [studentId, initialSubs]);

  const handleToggle = async (sub: MonthlySubscription) => {
    const subId = getId(sub);
    const status = sub.status?.trim() as SubscriptionStatus;
    if (!subId || status === "not_due" || status === "exempt" || updatingIds.has(subId)) return;
    const newStatus: SubscriptionStatus = status === "paid" ? "due" : "paid";
    setSaveError("");
    // Optimistic Update: 0ms instant color change
    setSubs((prev) => prev.map((s) => getId(s) === subId ? { ...s, status: newStatus } : s));
    setUpdatingIds((prev) => new Set(prev).add(subId));
    try {
      const updated = await SubscriptionsService.updateSubscription(subId, { status: newStatus });
      setSubs((prev) => {
        const next = prev.map(s => getId(s) === subId ? { ...s, ...updated } : s);
        onChanged?.(next);
        return next;
      });
    } catch {
      setSubs((prev) => prev.map((s) => getId(s) === subId ? { ...s, status: sub.status } : s));
      setSaveError("تعذر حفظ حالة الدفع. لم يتم اعتماد التغيير.");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(subId);
        return next;
      });
    }
  };

  const dueSubs = subs.filter((s) => s.status !== "not_due");
  const paidSubs = subs.filter((s) => s.status === "paid" || s.status === "exempt");
  const totalDue = dueSubs.length;
  const totalPaid = paidSubs.length;
  const percent = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  if (loading) return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title"><CheckCircle size={16} style={{ color: "var(--color-teal)" }} /><span>سجل الدفع</span></h3>
      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "1rem 0" }}>جاري التحميل...</div>
    </div>
  );

  if (error) return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title"><CheckCircle size={16} style={{ color: "var(--color-teal)" }} /><span>سجل الدفع</span></h3>
      <div style={{ color: "#ef4444", fontSize: "0.85rem", padding: "1rem 0" }}>حدث خطأ أثناء تحميل سجل الدفع.</div>
    </div>
  );

  if (subs.length === 0) return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title"><CheckCircle size={16} style={{ color: "var(--color-teal)" }} /><span>سجل الدفع</span></h3>
      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "1rem 0" }}>لا توجد اشتراكات مسجلة.</div>
    </div>
  );

  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title" style={{ marginBottom: "1rem" }}>
        <CheckCircle size={16} style={{ color: "var(--color-teal)" }} />
        <span>سجل الدفع</span>
        <span style={{ marginRight: "auto", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 400 }}>
          {totalPaid}/{totalDue} مستحق
        </span>
      </h3>

      {/* Summary */}
      {saveError && <p role="alert" style={{ color: "#ef4444" }}>{saveError}</p>}
      <div style={{ marginBottom: "1rem", padding: "0.75rem", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.5rem", textAlign: "center" }}>
        {[
          { label: "الأشهر المستحقة", value: totalDue,             color: "#94a3b8" },
          { label: "تم السداد",        value: totalPaid,            color: "#10b981" },
          { label: "المتبقي",          value: totalDue - totalPaid, color: "#ef4444" },
          { label: "نسبة الالتزام",    value: `${percent}%`,        color: percent >= 80 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#ef4444" },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden", marginBottom: "1rem" }}>
        <div style={{ height: "100%", width: `${percent}%`, background: percent >= 80 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#ef4444", borderRadius: "3px", transition: "width 0.5s ease" }} />
      </div>

      {/* Month grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.4rem" }}>
        {subs.map((sub) => {
          const subId = getId(sub);
          const status = sub.status?.trim() as SubscriptionStatus;
          const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["not_due"];
          const clickable = status === "due" || status === "paid";
          const isUpdating = updatingIds.has(subId);
          return (
            <div
              key={subId || `${sub.month}-${sub.year}`}
              onClick={() => handleToggle(sub)}
              role="button"
              tabIndex={clickable ? 0 : -1}
              onKeyDown={(e) => e.key === "Enter" && handleToggle(sub)}
              style={{
                padding: "0.5rem 0.4rem", borderRadius: "8px",
                border: `1px solid ${cfg.color}33`, background: cfg.bg, color: cfg.color,
                fontSize: "0.7rem", fontWeight: 500,
                display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                cursor: clickable ? "pointer" : "default",
                opacity: isUpdating ? 0.5 : 1,
                transition: "opacity 0.2s",
                userSelect: "none",
              }}
            >
              <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>{arabicMonths[sub.month - 1].slice(0, 3)} {sub.year}</span>
              {cfg.icon}
              <span style={{ fontSize: "0.6rem" }}>{cfg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
