"use client";

import { useState } from "react";
import { Calendar, RefreshCw, AlertTriangle, Check, Wrench } from "lucide-react";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export interface MonthYear {
  month: number;
  year: number;
}

// السنة الأكاديمية الحالية: تبدأ من يوليو
// لو الشهر الحالي >= 7 → السنة الأكاديمية هي currentYear / currentYear+1
// لو الشهر الحالي < 7  → السنة الأكاديمية هي currentYear-1 / currentYear
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

interface Props {
  activeMonths: number[];
  activeMonthYears: MonthYear[];
  onChange: (months: number[], monthYears: MonthYear[]) => void;
  onSave: (months: number[], monthYears: MonthYear[]) => Promise<void>;
  onToast: (msg: string, type: "success" | "error") => void;
}

export function AcademicYearSection({ activeMonthYears, onChange, onSave, onToast }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [showConfirmFix, setShowConfirmFix] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);

  const available = getAvailableMonths();
  const { startYear, endYear } = getCurrentAcademicYear();

  const toggle = (m: number, y: number) => {
    const wasActive = isActive(activeMonthYears, m, y);
    const newList = wasActive
      ? activeMonthYears.filter((x) => !(x.month === m && x.year === y))
      : [...activeMonthYears, { month: m, year: y }];

    onChange(newList.map((x) => x.month), newList);
    setPendingSync(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(activeMonthYears.map((x) => x.month), activeMonthYears);
      setPendingSync(false);
      onToast("✓ تم حفظ إعدادات السنة الدراسية وتحديث اشتراكات الطلاب بنجاح", "success");
    } catch {
      onToast("فشل الحفظ، حاول مرة أخرى", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncAll = async () => {
    if (pendingSync) {
      await handleSave();
      return;
    }
    setSyncing(true);
    try {
      const result = await SubscriptionsService.syncAllStudents();
      setPendingSync(false);
      onToast(`✓ تمت مزامنة اشتراكات ${result.synced} طالب بنجاح`, "success");
    } catch {
      onToast("فشلت المزامنة، حاول مرة أخرى", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleFixRollover = async () => {
    setFixing(true);
    try {
      const result = await SubscriptionsService.fixRolloverData();
      setShowConfirmFix(false);
      if (!result.removedYears || result.removedYears.length === 0) {
        onToast("لا توجد بيانات خاطئة للإصلاح", "success");
      } else {
        onToast(`✓ تم تصحيح الشهور النشطة للسنوات ${result.removedYears.join(", ")} بنجاح`, "success");
        const { startYear: sY, endYear: eY } = getCurrentAcademicYear();
        const corrected = activeMonthYears.filter((x) =>
          (x.year === sY && x.month >= 7) || (x.year === eY && x.month <= 6)
        );
        onChange(corrected.map((x) => x.month), corrected);
      }
    } catch {
      onToast("فشل الإصلاح، حاول مرة أخرى", "error");
    } finally {
      setFixing(false);
    }
  };

  // تقسيم الشهور لمجموعتين: النصف الأول (يوليو-ديسمبر) والنصف الثاني (يناير-يونيو)
  const firstHalf = available.filter((x) => x.year === startYear);
  const secondHalf = available.filter((x) => x.year === endYear);

  return (
    <div>
      <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--color-info)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Calendar size={18} /> إعدادات السنة الدراسية
      </h3>
      <p className="settings-description" style={{ marginBottom: "0.5rem" }}>
        اختر الأشهر التي يعمل بها المعلم. سيتم إنشاء اشتراكات الطلاب ومطالبتهم بالدفع بناءً على هذه الأشهر فقط.
      </p>
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        السنة الدراسية الحالية: {startYear} / {endYear}
      </p>

      {/* النصف الأول: يوليو → ديسمبر */}
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
        {startYear} (الفصل الأول)
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
        {endYear} (الفصل الثاني)
      </p>
      <div className="settings-months-grid" style={{ marginBottom: "0.75rem" }}>
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

      {/* تنبيه التغييرات غير المحفوظة */}
      {pendingSync && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.6rem 0.85rem", borderRadius: "8px",
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
          color: "#f59e0b", fontSize: "0.82rem", margin: "0.75rem 0"
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>لديك تعديلات غير محفوظة في الشهور النشطة. اضغط على &quot;حفظ وتطبيق الشهور&quot; لتحديث اشتراكات الطلاب.</span>
        </div>
      )}

      {/* تأكيد إصلاح البيانات */}
      {showConfirmFix && (
        <div style={{
          padding: "0.85rem", borderRadius: "8px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#ef4444", fontSize: "0.83rem", margin: "0.75rem 0"
        }}>
          <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600 }}>
            تأكيد الإصلاح: سيتم تصحيح الشهور النشطة للسنة الحالية مع الاحتفاظ التام بكافة الاشتراكات والمديونيات السابقة. هل تريد المتابعة؟
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleFixRollover}
              disabled={fixing}
              style={{
                padding: "0.35rem 0.75rem", borderRadius: "6px",
                background: "#ef4444", color: "white", border: "none",
                fontSize: "0.8rem", fontWeight: 600, cursor: fixing ? "not-allowed" : "pointer"
              }}
            >
              {fixing ? "جاري الإصلاح..." : "نعم، إصلاح الآن"}
            </button>
            <button
              onClick={() => setShowConfirmFix(false)}
              disabled={fixing}
              style={{
                padding: "0.35rem 0.75rem", borderRadius: "6px",
                background: "transparent", color: "var(--text-secondary)",
                border: "1px solid var(--border-color)", fontSize: "0.8rem", cursor: "pointer"
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="settings-sync-row" style={{ marginTop: "1rem" }}>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
          الأشهر المحددة: {activeMonthYears.length} شهر
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {activeMonthYears.some((x) => x.year > endYear) && !showConfirmFix && (
            <button
              onClick={() => setShowConfirmFix(true)}
              disabled={fixing}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.45rem 0.9rem", borderRadius: "8px", cursor: fixing ? "not-allowed" : "pointer",
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
                color: "#ef4444", fontSize: "0.82rem", fontWeight: 600, opacity: fixing ? 0.7 : 1,
              }}
            >
              <Wrench size={14} />
              إصلاح بيانات خاطئة
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving || syncing}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.45rem 1rem", borderRadius: "8px", cursor: (saving || syncing) ? "not-allowed" : "pointer",
              background: pendingSync ? "#14b8a6" : "rgba(99,102,241,0.15)",
              border: `1px solid ${pendingSync ? "#14b8a6" : "rgba(99,102,241,0.35)"}`,
              color: pendingSync ? "#ffffff" : "#818cf8",
              fontSize: "0.85rem", fontWeight: 600, opacity: (saving || syncing) ? 0.7 : 1,
              transition: "all 0.2s",
              boxShadow: pendingSync ? "0 2px 10px rgba(20,184,166,0.3)" : "none",
            }}
          >
            {saving ? (
              <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Check size={14} />
            )}
            {saving ? "جاري الحفظ والمزامنة..." : pendingSync ? "حفظ وتطبيق الشهور" : "حفظ الإعدادات"}
          </button>

          <button
            onClick={handleSyncAll}
            disabled={syncing || saving}
            title="إعادة مزامنة اشتراكات الطلاب مع الشهور النشطة"
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.45rem 0.9rem", borderRadius: "8px", cursor: (syncing || saving) ? "not-allowed" : "pointer",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)", fontSize: "0.82rem", fontWeight: 500, opacity: (syncing || saving) ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
            {syncing ? "جاري المزامنة..." : "إعادة مزامنة الطلاب"}
          </button>
        </div>
      </div>
    </div>
  );
}
