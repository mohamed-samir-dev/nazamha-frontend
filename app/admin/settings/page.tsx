"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Settings, Globe, EyeOff, AlertTriangle, MessageSquare,
  QrCode, Check, AlertCircle, RefreshCw, Shield, Lock,
  Save, X
} from "lucide-react";
import { AuthService } from "@/lib/services/authService";
import { SystemSettingsService, SystemSettings } from "@/lib/services/systemSettingsService";

// ── Toggle component ──────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="admin-toggle"
      style={{
        background: checked ? "rgba(20,184,166,0.9)" : "rgba(255,255,255,0.12)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={() => !disabled && onChange(!checked)}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !disabled) onChange(!checked);
      }}
    >
      <div
        className="admin-toggle-knob"
        style={{ right: checked ? "2.5px" : "calc(100% - 18.5px)" }}
      />
    </div>
  );
}

// ── Section nav items ─────────────────────────────────────────────────────────

type SectionId = "general" | "platform" | "security" | "danger";

interface Section {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  superAdminOnly?: boolean;
}

const SECTIONS: Section[] = [
  { id: "general", label: "عام", icon: <Globe size={15} /> },
  { id: "platform", label: "المنصة", icon: <Settings size={15} /> },
  { id: "security", label: "الأمان", icon: <Lock size={15} /> },
  { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={15} />, superAdminOnly: true },
];

// ── Loading skeleton ──────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-panel panel-content">
          <div className="admin-skeleton" style={{ width: "35%", height: 20, marginBottom: 16 }} />
          {[1, 2].map((j) => (
            <div
              key={j}
              style={{
                padding: "1rem 0",
                borderBottom: j === 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <div className="admin-skeleton" style={{ width: "25%", height: 15, marginBottom: 6 }} />
              <div className="admin-skeleton" style={{ width: "55%", height: 12, marginBottom: 12 }} />
              <div className="admin-skeleton" style={{ width: "100%", height: 38, borderRadius: 9 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  dangerous?: boolean;
}

function ConfirmModal({
  title, description, confirmLabel, onConfirm, onCancel, loading, dangerous,
}: ConfirmModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="glass-panel panel-content"
        style={{ width: "100%", maxWidth: 420, padding: "1.75rem" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1.25rem" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} style={{ color: "#f87171" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.375rem" }}>{title}</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              {description}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            إلغاء
          </button>
          <button
            className={dangerous ? "btn btn-danger" : "btn btn-primary"}
            onClick={onConfirm}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            {loading ? <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
            {loading ? "جاري التنفيذ..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("general");
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<SystemSettings>({
    site_name: "",
    site_logo: "",
  });
  const [savedSettings, setSavedSettings] = useState<SystemSettings>({
    site_name: "",
    site_logo: "",
  });
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Danger zone
  const [confirmMaintenanceOff, setConfirmMaintenanceOff] = useState(false);
  const [confirmMaintenanceOn, setConfirmMaintenanceOn] = useState(false);
  const [dangerActionLoading, setDangerActionLoading] = useState(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const user = await AuthService.getUser();
      if (!user || !user.is_admin) {
        router.replace("/admin/login");
        return;
      }
      setIsSuperAdmin(!!user.is_super_admin);

      const data = await SystemSettingsService.getSettings();
      if (data) {
        setSettings(data);
        setSavedSettings(data);
      }
    } catch {
      setError("فشل تحميل الإعدادات. تحقق من الاتصال وأعد المحاولة.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [loadData]);

  // Track dirty state
  useEffect(() => {
    const dirty =
      settings.site_name !== savedSettings.site_name ||
      settings.sidebar_name !== savedSettings.sidebar_name ||
      settings.site_logo !== savedSettings.site_logo ||
      settings.hide_sidebar_name !== savedSettings.hide_sidebar_name ||
      settings.maintenance_mode !== savedSettings.maintenance_mode ||
      settings.maintenance_message !== savedSettings.maintenance_message ||
      settings.welcome_message !== savedSettings.welcome_message ||
      settings.welcome_message_enabled !== savedSettings.welcome_message_enabled ||
      settings.qr_header_type !== savedSettings.qr_header_type;
    setIsDirty(dirty);
  }, [settings, savedSettings]);

  const update = useCallback(<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await SystemSettingsService.updateSettings(settings);
      setSavedSettings({ ...settings });
      setIsDirty(false);
      showToast("تم حفظ الإعدادات بنجاح");
    } catch {
      showToast("فشل حفظ الإعدادات. حاول مرة أخرى.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setSettings({ ...savedSettings });
    setIsDirty(false);
  };

  const handleToggleMaintenance = async (enable: boolean) => {
    setDangerActionLoading(true);
    try {
      const updated = { ...settings, maintenance_mode: enable };
      await SystemSettingsService.updateSettings(updated);
      setSettings(updated);
      setSavedSettings(updated);
      setIsDirty(false);
      showToast(enable ? "تم تفعيل وضع الصيانة" : "تم إلغاء وضع الصيانة");
    } catch {
      showToast("فشل تحديث وضع الصيانة", "error");
    } finally {
      setDangerActionLoading(false);
      setConfirmMaintenanceOff(false);
      setConfirmMaintenanceOn(false);
    }
  };

  const visibleSections = SECTIONS.filter(
    (s) => !s.superAdminOnly || isSuperAdmin
  );

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <div style={{ marginBottom: "1.75rem" }}>
          <div className="admin-skeleton" style={{ width: "220px", height: 28, marginBottom: 8 }} />
          <div className="admin-skeleton" style={{ width: "300px", height: 14 }} />
        </div>
        <div className="admin-settings-layout">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="admin-skeleton"
                style={{ height: 38, borderRadius: 9 }}
              />
            ))}
          </div>
          <SettingsSkeleton />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <div
          className="glass-panel panel-content"
          style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center", padding: "2.5rem" }}
        >
          <AlertCircle size={44} style={{ color: "var(--color-danger)", margin: "0 auto 1rem", display: "block" }} />
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>تعذّر تحميل الإعدادات</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            {error}
          </p>
          <button
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            onClick={() => { setLoading(true); loadData(); }}
          >
            <RefreshCw size={15} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // ── Section renderers ──────────────────────────────────────────────────────

  const renderGeneral = () => (
    <div className="glass-panel panel-content">
      <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>الإعدادات العامة</h2>
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        معلومات هوية المنصة وإعدادات الواجهة الأساسية
      </p>

      {/* Site Name */}
      <div className="admin-setting-row full-width">
        <div style={{ marginBottom: "0.75rem" }}>
          <p className="admin-setting-label">اسم المنصة</p>
          <p className="admin-setting-desc">
            يظهر في تاب المتصفح وفي مختلف أجزاء الواجهة
          </p>
        </div>
        <input
          type="text"
          className="search-input"
          dir="auto"
          placeholder="مثال: منصة التعليم"
          value={settings.site_name ?? ""}
          onChange={(e) => update("site_name", e.target.value)}
        />
      </div>

      {/* Sidebar Name */}
      {!settings.hide_sidebar_name && (
        <div className="admin-setting-row full-width">
          <div style={{ marginBottom: "0.75rem" }}>
            <p className="admin-setting-label">الاسم في القائمة الجانبية</p>
            <p className="admin-setting-desc">
              يُفضل أن يكون قصيراً — يظهر في أعلى الشريط الجانبي للمدرسين
            </p>
          </div>
          <input
            type="text"
            className="search-input"
            dir="auto"
            placeholder="اسم قصير للـ Sidebar"
            value={settings.sidebar_name ?? ""}
            onChange={(e) => update("sidebar_name", e.target.value)}
          />
        </div>
      )}

      {/* Hide sidebar name */}
      <div className="admin-setting-row">
        <div>
          <p className="admin-setting-label">إخفاء الاسم من القائمة الجانبية</p>
          <p className="admin-setting-desc">
            إذا كنت تريد عرض الشعار فقط بدون نص
          </p>
        </div>
        <Toggle
          checked={settings.hide_sidebar_name ?? false}
          onChange={(v) => update("hide_sidebar_name", v)}
        />
      </div>

      {/* Site Logo URL */}
      <div className="admin-setting-row full-width">
        <div style={{ marginBottom: "0.75rem" }}>
          <p className="admin-setting-label">رابط شعار المنصة (URL)</p>
          <p className="admin-setting-desc">
            رابط الصورة التي تستخدم كأيقونة في المتصفح والواجهة
          </p>
        </div>
        <input
          type="text"
          className="search-input"
          dir="ltr"
          placeholder="https://example.com/logo.png"
          value={settings.site_logo ?? ""}
          onChange={(e) => update("site_logo", e.target.value)}
        />
        {settings.site_logo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginTop: "0.75rem",
              padding: "0.75rem",
              borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.site_logo}
              alt="معاينة الشعار"
              style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>معاينة الشعار</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderPlatform = () => (
    <>
      {/* Welcome Message */}
      <div className="glass-panel panel-content">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.2)",
                color: "#60a5fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                رسالة ترحيب للمدرسين
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                تظهر لجميع المدرسين عند دخولهم للمنصة
              </p>
            </div>
          </div>
          <Toggle
            checked={settings.welcome_message_enabled ?? false}
            onChange={(v) => update("welcome_message_enabled", v)}
          />
        </div>

        <div className="admin-setting-row full-width">
          <div style={{ marginBottom: "0.75rem" }}>
            <p className="admin-setting-label">نص الرسالة</p>
            <p className="admin-setting-desc">
              الرسالة التي ستظهر في أعلى لوحة تحكم كل مدرس
            </p>
          </div>
          <textarea
            className="search-input"
            rows={3}
            dir="auto"
            placeholder="مثال: مرحباً بكم في المنصة، نتمنى لكم تجربة رائعة!"
            value={settings.welcome_message ?? ""}
            onChange={(e) => update("welcome_message", e.target.value)}
            disabled={!settings.welcome_message_enabled}
            style={{
              resize: "vertical",
              padding: "0.625rem 1rem",
              opacity: settings.welcome_message_enabled ? 1 : 0.4,
              transition: "opacity 0.2s",
            }}
          />
        </div>
      </div>

      {/* QR Header Settings */}
      <div className="glass-panel panel-content">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(20,184,166,0.12)",
              border: "1px solid rgba(20,184,166,0.2)",
              color: "#2dd4bf",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <QrCode size={16} />
          </div>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
              هيدر بطاقة QR
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
              ما الذي يظهر فوق كود QR في بطاقة كل طالب عند الطباعة
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {(["teacher", "image"] as const).map((val) => (
            <label
              key={val}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                padding: "0.875rem 1rem",
                borderRadius: 10,
                cursor: "pointer",
                background:
                  (settings.qr_header_type ?? "teacher") === val
                    ? "rgba(20,184,166,0.07)"
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  (settings.qr_header_type ?? "teacher") === val
                    ? "rgba(20,184,166,0.3)"
                    : "rgba(255,255,255,0.06)"
                }`,
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="radio"
                name="qr_header_type"
                value={val}
                checked={(settings.qr_header_type ?? "teacher") === val}
                onChange={() => update("qr_header_type", val)}
                style={{ accentColor: "#14b8a6", width: 16, height: 16, cursor: "pointer" }}
              />
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.2rem" }}>
                  {val === "teacher" ? "اسم المدرس + رقمه" : "شعار المنصة"}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                  {val === "teacher"
                    ? "يظهر اسم المدرس ورقم هاتفه في أعلى البطاقة"
                    : "يظهر شعار المنصة (nazamha.webp) في أعلى البطاقة"}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </>
  );

  const renderSecurity = () => (
    <div className="glass-panel panel-content">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.2)",
            color: "#a78bfa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Shield size={16} />
        </div>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
            إعدادات الأمان
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
            الأمان المُدار من الـ Backend — هذه المعلومات للقراءة فقط
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {[
          {
            label: "المصادقة",
            desc: "JWT HttpOnly cookies — آمنة ضد XSS",
            status: "active" as const,
          },
          {
            label: "CSRF Protection",
            desc: "حماية CSRF مفعّلة على جميع الطلبات المتحوّلة",
            status: "active" as const,
          },
          {
            label: "Route Guard",
            desc: "Middleware يتحقق من الـ JWT قبل كل صفحة محمية",
            status: "active" as const,
          },
          {
            label: "Rate Limiting",
            desc: "مُطبَّق على مستوى الـ Backend API",
            status: "active" as const,
          },
          {
            label: "تشفير كلمات المرور",
            desc: "bcrypt hashing — كلمات المرور لا تُخزَّن كـ plaintext",
            status: "active" as const,
          },
        ].map((item) => (
          <div key={item.label} className="admin-feature-row">
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.2rem", color: "var(--text-primary)" }}>
                {item.label}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                {item.desc}
              </p>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 6,
                background: "rgba(16,185,129,0.12)",
                color: "#34d399",
                border: "1px solid rgba(16,185,129,0.2)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                }}
              />
              مفعّل
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "1.25rem",
          padding: "0.875rem 1rem",
          borderRadius: 10,
          background: "rgba(59,130,246,0.06)",
          border: "1px solid rgba(59,130,246,0.15)",
        }}
      >
        <p style={{ fontSize: "0.78rem", color: "#93c5fd", margin: 0, lineHeight: 1.6 }}>
          إعدادات الأمان الحساسة (مهلة الجلسة، حدود الطلبات، إلخ.) تُدار من ملفات إعداد الـ Backend
          ولا تُعرض هنا لأسباب أمنية.
        </p>
      </div>
    </div>
  );

  const renderDanger = () => (
    <div className="admin-danger-zone">
      <div className="admin-danger-header">
        <AlertTriangle size={18} style={{ color: "#f87171" }} />
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#f87171", margin: 0 }}>
            Danger Zone
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
            هذه الإجراءات لها تأثير مباشر على المنصة وجميع المستخدمين
          </p>
        </div>
      </div>

      <div className="admin-danger-content">
        {/* Maintenance Mode */}
        <div className="admin-danger-item">
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 0.25rem", color: settings.maintenance_mode ? "#f87171" : "var(--text-primary)" }}>
              وضع الصيانة
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              {settings.maintenance_mode
                ? "المنصة في وضع الصيانة حالياً — المدرسون لا يستطيعون الدخول."
                : "عند التفعيل، سيُمنع جميع المدرسين من الدخول فوراً حتى تلغي وضع الصيانة."}
            </p>
          </div>
          <button
            className={settings.maintenance_mode ? "btn btn-secondary" : "btn btn-danger"}
            style={{
              whiteSpace: "nowrap",
              fontSize: "0.85rem",
              flexShrink: 0,
              ...(settings.maintenance_mode
                ? { background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.3)", color: "#34d399" }
                : {}),
            }}
            onClick={() =>
              settings.maintenance_mode
                ? setConfirmMaintenanceOff(true)
                : setConfirmMaintenanceOn(true)
            }
            disabled={dangerActionLoading}
          >
            {dangerActionLoading ? (
              <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} />
            ) : settings.maintenance_mode ? (
              "إلغاء وضع الصيانة"
            ) : (
              "تفعيل وضع الصيانة"
            )}
          </button>
        </div>

        {/* Maintenance Message (shown when mode is on) */}
        {settings.maintenance_mode && (
          <div
            style={{
              padding: "1rem",
              borderRadius: 10,
              background: "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.12)",
            }}
          >
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              رسالة الصيانة (اختياري)
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.625rem" }}>
              الرسالة التي ستظهر للمدرسين الذين يحاولون الدخول
            </p>
            <input
              type="text"
              className="search-input"
              dir="auto"
              placeholder="مثال: المنصة في صيانة مؤقتة، سنعود قريباً..."
              value={settings.maintenance_message ?? ""}
              onChange={(e) => update("maintenance_message", e.target.value)}
              style={{ fontSize: "0.875rem" }}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "2rem 2rem 5rem", minHeight: "100vh" }}>

      {/* ── Page Header ── */}
      <div className="admin-page-header" style={{ marginBottom: "1.75rem" }}>
        <div className="admin-page-title">
          <h1>إعدادات المنصة</h1>
          <span className="admin-page-subtitle">
            تكوين وضبط إعدادات المنصة التعليمية
          </span>
        </div>
        {isDirty && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.78rem",
                color: "#fbbf24",
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)",
                padding: "0.3rem 0.75rem",
                borderRadius: 8,
              }}
            >
              تغييرات غير محفوظة
            </span>
          </div>
        )}
      </div>

      {/* ── Layout ── */}
      <div className="admin-settings-layout">

        {/* Settings Nav */}
        <nav className="admin-settings-nav">
          {visibleSections.map((section) => (
            <button
              key={section.id}
              className={`admin-settings-nav-item ${activeSection === section.id ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span
                style={{
                  color:
                    activeSection === section.id
                      ? "#a78bfa"
                      : section.id === "danger"
                      ? "#f87171"
                      : "var(--text-muted)",
                }}
              >
                {section.icon}
              </span>
              <span
                style={{
                  color:
                    section.id === "danger" && activeSection !== "danger"
                      ? "#f87171"
                      : undefined,
                }}
              >
                {section.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Settings Content */}
        <form onSubmit={handleSave} className="admin-settings-content">
          {activeSection === "general" && renderGeneral()}
          {activeSection === "platform" && renderPlatform()}
          {activeSection === "security" && renderSecurity()}
          {activeSection === "danger" && isSuperAdmin && renderDanger()}

          {/* Save bar — shown for saveable sections */}
          {activeSection !== "security" && activeSection !== "danger" && (
            <div
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {isDirty ? (
                  <span style={{ fontSize: "0.82rem", color: "#fbbf24", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <AlertTriangle size={13} />
                    يوجد تغييرات لم تُحفظ بعد
                  </span>
                ) : (
                  <span style={{ fontSize: "0.82rem", color: "#34d399", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Check size={13} />
                    الإعدادات محدّثة
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {isDirty && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                    onClick={handleDiscard}
                  >
                    <X size={14} />
                    تجاهل التغييرات
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !isDirty}
                  style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {saving ? (
                    <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <Save size={14} />
                  )}
                  {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </div>
          )}

          {/* Danger zone save (maintenance message) */}
          {activeSection === "danger" && isSuperAdmin && settings.maintenance_mode && isDirty && (
            <div
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "1rem 1.25rem",
                gap: "0.5rem",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: "0.875rem" }}
                onClick={handleDiscard}
              >
                تجاهل
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                {saving ? (
                  <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <Save size={14} />
                )}
                {saving ? "جاري الحفظ..." : "حفظ رسالة الصيانة"}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* ── Confirm Modals ── */}
      {confirmMaintenanceOn && (
        <ConfirmModal
          title="تفعيل وضع الصيانة"
          description="سيُمنع جميع المدرسين فوراً من الدخول إلى المنصة حتى تقوم بإلغاء وضع الصيانة يدوياً. هل أنت متأكد؟"
          confirmLabel="تفعيل وضع الصيانة"
          dangerous
          loading={dangerActionLoading}
          onConfirm={() => handleToggleMaintenance(true)}
          onCancel={() => setConfirmMaintenanceOn(false)}
        />
      )}
      {confirmMaintenanceOff && (
        <ConfirmModal
          title="إلغاء وضع الصيانة"
          description="سيتمكن جميع المدرسين النشطين من الدخول مجدداً. هل تريد المتابعة؟"
          confirmLabel="إلغاء وضع الصيانة"
          loading={dangerActionLoading}
          onConfirm={() => handleToggleMaintenance(false)}
          onCancel={() => setConfirmMaintenanceOff(false)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-8 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl ${
            toast.type === "success"
              ? "bg-emerald-950 border border-emerald-600 text-emerald-50"
              : "bg-red-950 border border-red-600 text-red-50"
          }`}
          style={{ left: "50%", transform: "translateX(-50%)" }}
        >
          {toast.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
          <span style={{ fontSize: "0.875rem" }}>{toast.message}</span>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
