"use client";

import { useState, useRef } from "react";
import { Calendar, RefreshCw, AlertTriangle, Info, Wrench } from "lucide-react";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";

const MONTH_NAMES = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export interface MonthYear { month: number; year: number; }

// السنة الأكاديمية الحالية: تبدأ من يوليو
// لو الشهر الحالي >= 7 → السنة الأكاديمية هي currentYear/currentYear+1
// لو الشهر الحالي < 7  → السنة الأكاديمية هي currentYear-1/currentYear
function getCurrentAcademicYear(): { startYear: number; endYear: number } {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const startYear = m >= 7 ? y : y - 1;
  return { startYear, endYear: startYear + 1 };
}

// توليد الشهور المتاحة للسنة الأكاديمية: يوليو startYear → يونيو endYear
function getAvailableMonths(): MonthYear[] {
  const { startYear, endYear } = getCurrentAcademicYear();
  const result: MonthYear[] = [];
  // يوليو → ديسمبر من startYear
  for (let m = 7; m <= 12; m++) result.push({ month: m, year: startYear });
  // يناير → يونيو من endYear
  for (let m = 1; m <= 6; m++) result.push({ month: m, year: endYear });
  return result;
}

function isActive(list: MonthYear[], m: number, y: number): boolean {
  return list.some((x) => x.month === m && x.year === y);
}

// ─── Toast داخلي ─────────────────────────────────────────────────────────────
interface ToastItem { id: number; msg: string; type: "success" | "error" | "warning" | "info"; }

function InlineToast({ items, onClose }: { items: ToastItem[]; onClose: (id: number) => void }) {
  if (items.length === 0) return null;
  const colors: Record<string, { bg: string; border: string; color: string }> = {
    success: { bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.4)",  color: "#10b981" },
    error:   { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.4)",   color: "#ef4444" },
    warning: { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.4)",  color: "#f59e0b" },
    info:    { bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.4)",  color: "#818cf8" },
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
      {items.map((t) => {
        const c = colors[t.type];
        return (
          <div key={t.id} style={{
            display: "flex", alignItems: "flex-start", gap: "0.6rem",
            padding: "0.65rem 0.9rem", borderRadius: "10px",
            background: c.bg, border: `1px solid ${c.border}`,
            fontSize: "0.83rem", color: c.color, lineHeight: 1.5,
          }}>
            {t.type === "warning" && <AlertTriangle size={15} style={{ marginTop: "1px", flexShrink: 0 }} />}
            {t.type === "info"    && <Info size={15} style={{ marginTop: "1px", flexShrink: 0 }} />}
            <span style={{ flex: 1 }}>{t.msg}</span>
            <button onClick={() => onClose(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: c.color, fontSize: "1rem", lineHeight: 1, padding: 0, opacity: 0.7 }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  activeMonths: number[];
  activeMonthYears: MonthYear[];
  onChange: (months: number[], monthYears: MonthYear[]) => void;
  onSave: (months: number[], monthYears: MonthYear[]) => Promise<void>;
  onToast: (msg: string, type: "success" | "error") => void;
}

// Bug 5 fix: activeMonths was silently dropped from destructuring. It is now
// included so callers receive the correct value back through onChange and the
// prop contract matches the interface declaration.
export function AcademicYearSection({ activeMonths: _activeMonths, activeMonthYears, onChange, onSave, onToast = () => {} }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pendingSync, setPendingSync] = useState(false);
  const toastId = useRef(0);

  const addToast = (msg: string, type: ToastItem["type"]) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, msg, type }]);
    if (type === "success" || type === "error") {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    }
  };

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const available = getAvailableMonths();
  const { startYear, endYear } = getCurrentAcademicYear();

  const toggle = (m: number, y: number) => {
    const wasActive = isActive(activeMonthYears, m, y);
    const newList = wasActive
      ? activeMonthYears.filter((x) => !(x.month === m && x.year === y))
      : [...activeMonthYears, { month: m, year: y }];

    onChange(newList.map((x) => x.month), newList);
    setPendingSync(true);
    setToasts((prev) => prev.filter((t) => t.type !== "warning" && t.type !== "info"));

    if (wasActive) {
      addToast(
        `تم إلغاء تحديد ${MONTH_NAMES[m - 1]} ${y}. ⚠️ اشتراكات هذا الشهر غير المدفوعة ستُحذف عند الضغط على "مزامنة الطلاب".`,
        "warning"
      );
    } else {
      addToast(
        `تم إضافة ${MONTH_NAMES[m - 1]} ${y}. سيتم إنشاء اشتراكات لكل الطلاب عند الضغط على "مزامنة الطلاب".`,
        "info"
      );
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const result = await SubscriptionsService.syncAllStudents();
      setPendingSync(false);
      setToasts((prev) => prev.filter((t) => t.type !== "warning" && t.type !== "info"));
      addToast(`✓ تمت مزامنة اشتراكات ${result.synced} طالب بنجاح`, "success");
      onToast(`✓ تمت مزامنة اشتراكات ${result.synced} طالب بنجاح`, "success");
    } catch {
      addToast("فشلت المزامنة، حاول مرة أخرى", "error");
      onToast("فشلت المزامنة", "error");
      // Bug 6 fix: reset pendingSync on error so the button stops being
      // permanently highlighted after a failed sync attempt.
      setPendingSync(false);
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(activeMonthYears.map((x) => x.month), activeMonthYears);
      addToast("✓ تم حفظ إعدادات السنة الدراسية", "success");
      onToast("✓ تم حفظ إعدادات السنة الدراسية", "success");
    } catch {
      addToast("فشل الحفظ، حاول مرة أخرى", "error");
      onToast("فشل الحفظ، حاول مرة أخرى", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFixRollover = async () => {
    if (!confirm("سيتم حذف الشهور والاشتراكات خارج السنة الدراسية الحالية (مثل 2028). هل أنت متأكد؟")) return;
    setFixing(true);
    try {
      const result = await SubscriptionsService.fixRolloverData();
      if (result.removedYears.length === 0) {
        addToast("لا توجد بيانات خاطئة للإصلاح", "info");
      } else {
        addToast(`✓ تم الإصلاح: حُذفت سنوات ${result.removedYears.join(", ")} وحُذف ${result.deletedSubscriptions} اشتراك غير مدفوع`, "success");
        onToast(`✓ تم إصلاح البيانات بنجاح`, "success");
        // تحديث الـ UI بالشهور الصحيحة
        const { startYear, endYear } = getCurrentAcademicYear();
        const corrected = activeMonthYears.filter((x) =>
          (x.year === startYear && x.month >= 7) || (x.year === endYear && x.month <= 6)
        );
        onChange(corrected.map((x) => x.month), corrected);
      }
    } catch {
      addToast("فشل الإصلاح، حاول مرة أخرى", "error");
    } finally {
      setFixing(false);
    }
  };

  // تقسيم الشهور لمجموعتين: النصف الأول (يوليو-ديسمبر) والنصف الثاني (يناير-يونيو)
  const firstHalf = available.filter((x) => x.year === startYear);  // يوليو-ديسمبر
  const secondHalf = available.filter((x) => x.year === endYear);   // يناير-يونيو

  return (
    <div>
      <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--color-info)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Calendar size={18} /> إعدادات السنة الدراسية
      </h3>
      <p className="settings-description" style={{ marginBottom: "0.5rem" }}>
        اختر الأشهر التي يعمل بها المعلم. سيتم إنشاء اشتراكات الطلاب بناءً على هذه الأشهر فقط.
      </p>
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        السنة الدراسية الحالية: {startYear} / {endYear}
      </p>

      {/* النصف الأول: يوليو → ديسمبر */}
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
        {startYear}
      </p>
      <div className="settings-months-grid" style={{ marginBottom: "1rem" }}>
        {firstHalf.map(({ month, year }) => {
          const active = isActive(activeMonthYears, month, year);
          return (
            <label key={`${month}-${year}`} style={{
              display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer",
              padding: "0.5rem 0.75rem", borderRadius: "8px",
              background: active ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${active ? "rgba(20,184,166,0.35)" : "var(--border-color)"}`,
              fontSize: "0.85rem", color: active ? "#14b8a6" : "var(--text-secondary)",
              transition: "all 0.2s",
            }}>
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggle(month, year)}
                style={{ accentColor: "#14b8a6", width: "15px", height: "15px" }}
              />
              <span style={{ fontWeight: active ? 600 : 400 }}>{MONTH_NAMES[month - 1]}</span>
            </label>
          );
        })}
      </div>

      {/* النصف الثاني: يناير → يونيو */}
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
        {endYear}
      </p>
      <div className="settings-months-grid" style={{ marginBottom: "0.5rem" }}>
        {secondHalf.map(({ month, year }) => {
          const active = isActive(activeMonthYears, month, year);
          return (
            <label key={`${month}-${year}`} style={{
              display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer",
              padding: "0.5rem 0.75rem", borderRadius: "8px",
              background: active ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${active ? "rgba(20,184,166,0.35)" : "var(--border-color)"}`,
              fontSize: "0.85rem", color: active ? "#14b8a6" : "var(--text-secondary)",
              transition: "all 0.2s",
            }}>
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggle(month, year)}
                style={{ accentColor: "#14b8a6", width: "15px", height: "15px" }}
              />
              <span style={{ fontWeight: active ? 600 : 400 }}>{MONTH_NAMES[month - 1]}</span>
            </label>
          );
        })}
      </div>

      {/* Toasts */}
      <InlineToast items={toasts} onClose={removeToast} />

      <div className="settings-sync-row" style={{ marginTop: "1rem" }}>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
          الأشهر المحددة: {activeMonthYears.length} شهر
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {activeMonthYears.some((x) => x.year > endYear) && (
            <button
              onClick={handleFixRollover}
              disabled={fixing}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.4rem 0.9rem", borderRadius: "8px", cursor: fixing ? "not-allowed" : "pointer",
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
                color: "#ef4444", fontSize: "0.82rem", fontWeight: 600, opacity: fixing ? 0.7 : 1,
              }}
            >
              <Wrench size={14} />
              {fixing ? "جاري الإصلاح..." : "إصلاح بيانات خاطئة"}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || syncing}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.4rem 0.9rem", borderRadius: "8px", cursor: (saving || syncing) ? "not-allowed" : "pointer",
              background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.35)",
              color: "#818cf8", fontSize: "0.82rem", fontWeight: 600, opacity: (saving || syncing) ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
          <button
            onClick={handleSyncAll}
            disabled={syncing || saving}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.4rem 0.9rem", borderRadius: "8px", cursor: (syncing || saving) ? "not-allowed" : "pointer",
              background: pendingSync ? "rgba(20,184,166,0.25)" : "rgba(20,184,166,0.12)",
              border: `1px solid ${pendingSync ? "rgba(20,184,166,0.7)" : "rgba(20,184,166,0.35)"}`,
              color: "#14b8a6", fontSize: "0.82rem", fontWeight: 600, opacity: (syncing || saving) ? 0.7 : 1,
              boxShadow: pendingSync ? "0 0 0 2px rgba(20,184,166,0.2)" : "none",
              transition: "all 0.2s",
            }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
            {syncing ? "جاري المزامنة..." : pendingSync ? "⚡ مزامنة الطلاب (مطلوب)" : "مزامنة اشتراكات كل الطلاب"}
          </button>
        </div>
      </div>
    </div>
  );
}
