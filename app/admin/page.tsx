"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Users, LayoutDashboard, AlertTriangle,
  Clock, DollarSign, UserPlus, Settings,
  UserCog, Building2, RefreshCw, Check, AlertCircle,
  Calendar, TrendingUp, Activity, BookOpen,
  ClipboardCheck, Star
} from "lucide-react";
import { AuthService } from "@/lib/services/authService";
import { api } from "@/lib/apiClient";
import { Teacher } from "@/lib/types";
import TeachersTable from "./_components/TeachersTable";
import FeaturesModal from "./_components/FeaturesModal";

// ── Types ────────────────────────────────────────────────────────────────────

interface AdminStats {
  expiringSoon: number;
  pendingApproval: number;
}

// ── Skeleton components ──────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="admin-kpi-card">
      <div className="admin-kpi-top">
        <div className="admin-skeleton" style={{ width: 40, height: 40, borderRadius: 11 }} />
      </div>
      <div className="admin-skeleton" style={{ width: "60%", height: 32, marginTop: 4 }} />
      <div className="admin-skeleton" style={{ width: "45%", height: 14, marginTop: 4 }} />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="glass-panel panel-content">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div className="admin-skeleton" style={{ width: 36, height: 36, borderRadius: 9 }} />
        <div style={{ flex: 1 }}>
          <div className="admin-skeleton" style={{ width: "30%", height: 18, marginBottom: 6 }} />
          <div className="admin-skeleton" style={{ width: "20%", height: 13 }} />
        </div>
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            display: "flex", gap: "1rem", padding: "0.75rem 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="admin-skeleton" style={{ width: "22%", height: 14 }} />
          <div className="admin-skeleton" style={{ width: "14%", height: 14 }} />
          <div className="admin-skeleton" style={{ width: "10%", height: 14 }} />
          <div className="admin-skeleton" style={{ width: "12%", height: 14 }} />
          <div className="admin-skeleton" style={{ width: "15%", height: 14 }} />
        </div>
      ))}
    </div>
  );
}

// ── Subscription distribution (pure CSS, no external chart lib needed) ───────

interface DistItem {
  label: string;
  value: number;
  color: string;
  bg: string;
}

function SubscriptionDistribution({
  active, expired, pending, total,
}: {
  active: number; expired: number; pending: number; total: number;
}) {
  const items: DistItem[] = [
    { label: "نشط", value: active, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
    { label: "منتهي الاشتراك", value: expired, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    { label: "بانتظار المراجعة", value: pending, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  ];

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div style={{ width: "100%" }}>
      {/* Stacked bar */}
      {total > 0 && (
        <div
          style={{
            display: "flex",
            height: 8,
            borderRadius: 99,
            overflow: "hidden",
            marginBottom: "1.25rem",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          {items.map((item) =>
            item.value > 0 ? (
              <div
                key={item.label}
                style={{
                  width: `${pct(item.value)}%`,
                  background: item.color,
                  transition: "width 0.6s ease",
                }}
              />
            ) : null
          )}
        </div>
      )}

      {/* Legend rows */}
      <div className="admin-segment-row">
        {items.map((item) => (
          <div key={item.label} className="admin-segment-item">
            <span
              className="admin-segment-dot"
              style={{ background: item.color }}
            />
            <span className="admin-segment-label">{item.label}</span>
            <div className="admin-segment-bar-wrap">
              <div
                className="admin-segment-bar"
                style={{
                  width: `${pct(item.value)}%`,
                  background: item.color,
                }}
              />
            </div>
            <span className="admin-segment-value">{item.value}</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", minWidth: 30, textAlign: "left" }}>
              {pct(item.value)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feature adoption panel ────────────────────────────────────────────────────

function FeatureAdoption({ teachers }: { teachers: Teacher[] }) {
  const total = teachers.length;
  if (total === 0) return null;

  const features = [
    {
      label: "ميزة الفواتير المالية",
      icon: <DollarSign size={14} />,
      count: teachers.filter((t) => t.has_bills_feature).length,
      color: "#10b981",
    },
    {
      label: "ميزة الحضور والغياب",
      icon: <ClipboardCheck size={14} />,
      count: teachers.filter((t) => t.has_attendance_feature).length,
      color: "#3b82f6",
    },
    {
      label: "نظام السنتر",
      icon: <Building2 size={14} />,
      count: teachers.filter((t) => t.is_center_mode).length,
      color: "#a78bfa",
    },
    {
      label: "إدارة السناتر",
      icon: <Star size={14} />,
      count: teachers.filter((t) => t.has_centers_feature).length,
      color: "#f59e0b",
    },
  ];

  return (
    <div>
      {features.map((f) => (
        <div key={f.label} className="admin-feature-row">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: f.color }}>{f.icon}</span>
            <span className="admin-feature-name">{f.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span className="admin-feature-count">{f.count}</span>
            <span className="admin-feature-pct">
              ({total > 0 ? Math.round((f.count / total) * 100) : 0}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Alerts panel ──────────────────────────────────────────────────────────────

function AlertsPanel({
  expiringSoon,
  pendingApproval,
  maintenanceMode,
}: {
  expiringSoon: number;
  pendingApproval: number;
  maintenanceMode: boolean;
}) {
  const hasAlerts = expiringSoon > 0 || pendingApproval > 0 || maintenanceMode;
  if (!hasAlerts) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
      {maintenanceMode && (
        <div className="admin-alert-card danger">
          <AlertTriangle size={18} style={{ color: "#f87171", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f87171", margin: 0 }}>
              وضع الصيانة مفعّل
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              المدرسون لا يستطيعون الدخول حالياً.{" "}
              <Link href="/admin/settings" style={{ color: "#f87171", textDecoration: "underline" }}>
                تعديل الإعدادات
              </Link>
            </p>
          </div>
        </div>
      )}
      {expiringSoon > 0 && (
        <div className="admin-alert-card">
          <Clock size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f59e0b", margin: 0 }}>
              {expiringSoon} اشتراك ينتهي خلال 30 يوماً
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              راجع قائمة المدرسين وجدّد الاشتراكات.
            </p>
          </div>
        </div>
      )}
      {pendingApproval > 0 && (
        <div className="admin-alert-card">
          <AlertTriangle size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f59e0b", margin: 0 }}>
              {pendingApproval} حساب بانتظار الموافقة
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              حسابات مدرسين جديدة تحتاج إلى مراجعة وتفعيل.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hasCentersPermission, setHasCentersPermission] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  const [adminStats, setAdminStats] = useState<AdminStats>({ expiringSoon: 0, pendingApproval: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [featureModalTeacher, setFeatureModalTeacher] = useState<Teacher | null>(null);
  const [bannerMessage, setBannerMessage] = useState("");
  const [bannerType, setBannerType] = useState<"info" | "warning" | "success" | "danger">("info");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const user = await AuthService.getUser();
      if (!user) { router.replace("/admin/login"); return; }
      if (!user.is_admin) { router.replace("/admin/login"); return; }

      setIsAdmin(true);
      setIsSuperAdmin(!!user.is_super_admin);
      setHasCentersPermission(
        !!user.is_super_admin ||
        (user.financial_permissions ?? []).includes("centers.view")
      );

      const [teachersData, countsData, statsData, settingsData] = await Promise.all([
        api.get<Teacher[]>("/teachers"),
        api.get<{ students: Record<string, number>; groups: Record<string, number> }>(
          "/teachers/counts"
        ).catch(() => ({ students: {}, groups: {} })),
        api.get<AdminStats>("/teachers/admin-stats").catch(() => ({
          expiringSoon: 0,
          pendingApproval: 0,
        })),
        api.get<{ maintenance_mode?: boolean }>("/settings").catch(() => null),
      ]);

      setTeachers((teachersData ?? []).map((t) => ({ ...t })));
      setStudentCounts(countsData.students ?? {});
      setGroupCounts(countsData.groups ?? {});
      setAdminStats(statsData);
      setMaintenanceMode(!!(settingsData as { maintenance_mode?: boolean } | null)?.maintenance_mode);
      setLastUpdated(new Date());
    } catch {
      if (!isRefresh) setError("حدث خطأ أثناء تحميل البيانات.");
      else showToast("فشل تحديث البيانات.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Computed metrics ────────────────────────────────────────────────────────
  const now = new Date();
  const totalStudents = Object.values(studentCounts).reduce((a, b) => a + b, 0);
  const totalGroups = Object.values(groupCounts).reduce((a, b) => a + b, 0);
  const totalRevenue = teachers.reduce((s, t) => s + (t.subscription_price ?? 0), 0);
  const activeTeachers = teachers.filter(
    (t) => t.is_active && t.subscription_expires_at && new Date(t.subscription_expires_at) >= now
  ).length;
  const expiredTeachers = teachers.filter(
    (t) => t.subscription_expires_at && new Date(t.subscription_expires_at) < now
  ).length;
  const pendingTeachers = teachers.filter((t) => !t.is_active && !t.subscription_started_at).length;

  // ── Teacher action handlers ─────────────────────────────────────────────────
  const handleToggleActive = async (teacherId: string, current: boolean) => {
    setUpdatingId(teacherId);
    try {
      await api.patch(`/teachers/${teacherId}`, { is_active: !current });
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, is_active: !current } : t))
      );
      showToast("تم تحديث حالة التفعيل.");
    } catch {
      showToast("حدث خطأ.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleBills = async (teacherId: string, current: boolean) => {
    setUpdatingId(teacherId);
    try {
      await api.patch(`/teachers/${teacherId}`, { has_bills_feature: !current });
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, has_bills_feature: !current } : t))
      );
      showToast("تم تحديث ميزة الفواتير.");
    } catch {
      showToast("حدث خطأ.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleAttendance = async (teacherId: string, current: boolean) => {
    setUpdatingId(teacherId);
    try {
      await api.patch(`/teachers/${teacherId}`, { has_attendance_feature: !current });
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, has_attendance_feature: !current } : t))
      );
      showToast("تم تحديث ميزة الحضور.");
    } catch {
      showToast("حدث خطأ.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleCenterMode = async (teacherId: string, current: boolean) => {
    setUpdatingId(teacherId);
    try {
      await api.patch(`/teachers/${teacherId}`, { is_center_mode: !current });
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, is_center_mode: !current } : t))
      );
      showToast("تم تحديث نظام السنتر.");
    } catch {
      showToast("حدث خطأ.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleCentersFeature = async (teacherId: string, current: boolean) => {
    setUpdatingId(teacherId);
    try {
      await api.patch(`/teachers/${teacherId}`, { "features.centers": !current });
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, has_centers_feature: !current } : t))
      );
      showToast("تم تحديث ميزة إدارة السناتر.");
    } catch {
      showToast("حدث خطأ.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateExpiration = async (teacherId: string, date: string) => {
    if (!date) return;
    setUpdatingId(teacherId);
    try {
      const iso = new Date(date).toISOString();
      await api.patch(`/teachers/${teacherId}`, { subscription_expires_at: iso });
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, subscription_expires_at: iso } : t))
      );
      showToast("تم تحديث تاريخ الانتهاء.");
    } catch {
      showToast("حدث خطأ.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStartDate = async (teacherId: string, date: string) => {
    if (!date) return;
    setUpdatingId(teacherId);
    try {
      const iso = new Date(date).toISOString();
      await api.patch(`/teachers/${teacherId}`, { subscription_started_at: iso });
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, subscription_started_at: iso } : t))
      );
      showToast("تم تحديث تاريخ البداية.");
    } catch {
      showToast("حدث خطأ.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdatePrice = async (teacherId: string, price: number) => {
    setUpdatingId(teacherId);
    try {
      await api.patch(`/teachers/${teacherId}`, { subscription_price: price });
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, subscription_price: price } : t))
      );
      showToast("تم تحديث سعر الاشتراك.");
    } catch {
      showToast("حدث خطأ.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRenewYear = async (teacher: Teacher) => {
    const base =
      teacher.subscription_expires_at && new Date(teacher.subscription_expires_at) > new Date()
        ? new Date(teacher.subscription_expires_at)
        : new Date();
    base.setFullYear(base.getFullYear() + 1);
    await handleUpdateExpiration(teacher.id, base.toISOString().split("T")[0]);
    showToast(`✓ تم تجديد اشتراك ${teacher.name} لسنة إضافية`);
  };

  const handleUpdateBanner = async (
    teacher: Teacher,
    enabled: boolean,
    message: string,
    type: string
  ) => {
    setUpdatingId(teacher.id);
    try {
      await api.patch(`/teachers/${teacher.id}/banner`, { enabled, message, type });
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === teacher.id
            ? { ...t, banner: { enabled, message, type: type as "info" | "warning" | "success" | "danger" } }
            : t
        )
      );
      showToast(enabled ? `✓ تم تفعيل البانر لـ ${teacher.name}` : "تم إخفاء البانر");
    } catch {
      showToast("فشل تحديث البانر", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleVisibility = async (teacherId: string, current: boolean) => {
    setUpdatingId(teacherId);
    try {
      const res = await api.patch<{ hidden_from_admin: boolean }>(
        `/teachers/${teacherId}/visibility`,
        {}
      );
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, hidden_from_admin: res.hidden_from_admin } : t))
      );
      showToast(res.hidden_from_admin ? "تم إخفاء المدرس" : "تم إظهار المدرس");
    } catch {
      showToast("فشل تحديث الظهور", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (
      !confirm(
        `تحذير: سيتم حذف حساب "${teacher.name}" وكل بياناته نهائياً. هل أنت متأكد؟`
      )
    )
      return;
    setUpdatingId(teacher.id);
    try {
      await api.delete(`/teachers/${teacher.id}`);
      setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setStudentCounts((prev) => {
        const n = { ...prev };
        delete n[teacher.id];
        return n;
      });
      setGroupCounts((prev) => {
        const n = { ...prev };
        delete n[teacher.id];
        return n;
      });
      showToast(`✓ تم حذف حساب ${teacher.name}`);
    } catch (err: unknown) {
      showToast((err as Error).message ?? "فشل حذف المعلم.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ padding: "2rem 2rem 2rem", minHeight: "100vh" }}>
        {/* Header skeleton */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div className="admin-skeleton" style={{ width: "240px", height: 28, marginBottom: 8 }} />
          <div className="admin-skeleton" style={{ width: "320px", height: 14 }} />
        </div>
        {/* KPI skeletons */}
        <div className="admin-kpi-grid" style={{ marginBottom: "1.5rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
        {/* Table skeleton */}
        <TableSkeleton />
      </div>
    );
  }

  // Auth guard (visual only — middleware handles real auth)
  if (!isAdmin) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: "2rem",
        }}
      >
        <div
          className="glass-panel panel-content"
          style={{ maxWidth: 360, textAlign: "center", padding: "2.5rem" }}
        >
          <AlertCircle size={44} style={{ color: "var(--color-danger)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-muted)" }}>جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <div
          className="glass-panel panel-content"
          style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center", padding: "2.5rem" }}
        >
          <AlertCircle
            size={44}
            style={{ color: "var(--color-danger)", margin: "0 auto 1rem" }}
          />
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>تعذّر تحميل البيانات</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            {error}
          </p>
          <button
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            onClick={() => loadData()}
          >
            <RefreshCw size={15} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: "إجمالي المدرسين",
      value: teachers.length,
      icon: <Shield size={18} />,
      iconBg: "rgba(139,92,246,0.18)",
      iconColor: "#a78bfa",
      accent: "#7c3aed",
      sub: `${activeTeachers} نشط`,
    },
    {
      label: "المدرسون النشطون",
      value: activeTeachers,
      icon: <Users size={18} />,
      iconBg: "rgba(16,185,129,0.15)",
      iconColor: "#34d399",
      accent: "#10b981",
      sub: `${teachers.length > 0 ? Math.round((activeTeachers / teachers.length) * 100) : 0}% من الإجمالي`,
    },
    {
      label: "إجمالي الطلاب",
      value: totalStudents,
      icon: <Users size={18} />,
      iconBg: "rgba(20,184,166,0.15)",
      iconColor: "#2dd4bf",
      accent: "#14b8a6",
      sub: `في ${totalGroups} مجموعة`,
    },
    {
      label: "إجمالي المجموعات",
      value: totalGroups,
      icon: <LayoutDashboard size={18} />,
      iconBg: "rgba(59,130,246,0.15)",
      iconColor: "#60a5fa",
      accent: "#3b82f6",
      sub: null,
    },
    {
      label: "تنتهي خلال 30 يوم",
      value: adminStats.expiringSoon,
      icon: <Clock size={18} />,
      iconBg: "rgba(245,158,11,0.15)",
      iconColor: "#fbbf24",
      accent: "#f59e0b",
      sub: "اشتراكات تحتاج تجديد",
    },
    {
      label: "إجمالي الإيرادات",
      value: null,
      displayValue: `${totalRevenue.toLocaleString("ar-EG")} ج`,
      icon: <DollarSign size={18} />,
      iconBg: "rgba(16,185,129,0.12)",
      iconColor: "#4ade80",
      accent: "#22c55e",
      sub: "مجموع أسعار الاشتراكات",
    },
  ];

  return (
    <div style={{ padding: "2rem 2rem 3rem", minHeight: "100vh" }}>

      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h1>لوحة التحكم</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span className="admin-page-subtitle">
              مراقبة حسابات المدرسين والاشتراكات وإحصاءات المنصة
            </span>
            {lastUpdated && (
              <span className="admin-date-badge">
                <Activity size={12} />
                آخر تحديث:{" "}
                {lastUpdated.toLocaleTimeString("ar-EG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        <div className="admin-page-actions">
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.85rem", gap: "0.4rem" }}
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={14}
              style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }}
            />
            {refreshing ? "جاري التحديث..." : "تحديث"}
          </button>
          {isSuperAdmin && (
            <Link
              href="/admin/teachers"
              className="btn btn-secondary"
              style={{
                fontSize: "0.85rem",
                background: "rgba(20,184,166,0.08)",
                borderColor: "rgba(20,184,166,0.25)",
                color: "#5eead4",
              }}
            >
              <UserPlus size={14} />
              إضافة مدرس
            </Link>
          )}
        </div>
      </div>

      {/* ── Alerts ── */}
      <AlertsPanel
        expiringSoon={adminStats.expiringSoon}
        pendingApproval={adminStats.pendingApproval}
        maintenanceMode={maintenanceMode}
      />

      {/* ── KPI Cards ── */}
      <div className="admin-kpi-grid">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="admin-kpi-card"
            style={{ "--kpi-accent": card.accent } as React.CSSProperties}
          >
            <div className="admin-kpi-top">
              <div
                className="admin-kpi-icon"
                style={{ background: card.iconBg, color: card.iconColor }}
              >
                {card.icon}
              </div>
            </div>
            <div className="admin-kpi-value">
              {card.displayValue ?? (card.value ?? 0).toLocaleString("ar-EG")}
            </div>
            <div className="admin-kpi-label">{card.label}</div>
            {card.sub && <div className="admin-kpi-sub">{card.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Pending Approval alert badge ── */}
      {adminStats.pendingApproval > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            borderRadius: 12,
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.2)",
            marginBottom: "1.5rem",
          }}
        >
          <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <span style={{ fontSize: "0.875rem", color: "#fbbf24", fontWeight: 600 }}>
            {adminStats.pendingApproval} حساب جديد بانتظار المراجعة والتفعيل
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginRight: "auto",
            }}
          >
            راجع الجدول أدناه، قسم «مراجعة»
          </span>
        </div>
      )}

      {/* ── Analytics Row ── */}
      <div className="admin-dash-grid" style={{ marginBottom: "1.5rem" }}>

        {/* Left: Subscription distribution + Feature adoption */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Subscription distribution */}
          <div className="glass-panel panel-content">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  className="admin-kpi-icon"
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(20,184,166,0.12)",
                    color: "#2dd4bf",
                  }}
                >
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
                    توزيع الاشتراكات
                  </h2>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                    حالة اشتراكات المدرسين الحالية
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 6,
                  padding: "0.2rem 0.6rem",
                }}
              >
                {teachers.length} إجمالي
              </span>
            </div>

            {teachers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)" }}>
                <Users size={36} style={{ opacity: 0.2, margin: "0 auto 0.75rem" }} />
                <p style={{ fontSize: "0.875rem" }}>لا يوجد مدرسون بعد</p>
              </div>
            ) : (
              <SubscriptionDistribution
                active={activeTeachers}
                expired={expiredTeachers}
                pending={pendingTeachers}
                total={teachers.length}
              />
            )}
          </div>

          {/* Feature adoption */}
          {teachers.length > 0 && (
            <div className="glass-panel panel-content">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div
                  className="admin-kpi-icon"
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(139,92,246,0.12)",
                    color: "#a78bfa",
                  }}
                >
                  <BookOpen size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
                    استخدام الميزات
                  </h2>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                    نسبة تفعيل الميزات بين المدرسين
                  </p>
                </div>
              </div>
              <FeatureAdoption teachers={teachers} />
            </div>
          )}
        </div>

        {/* Right: Quick actions + Top expiring soon */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Quick Actions */}
          <div className="glass-panel panel-content">
            <h2
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Activity size={16} style={{ color: "#60a5fa" }} />
              إجراءات سريعة
            </h2>
            <div className="admin-quick-actions">
              {isSuperAdmin && (
                <Link href="/admin/teachers" className="admin-quick-action-btn">
                  <div
                    className="admin-quick-action-icon"
                    style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}
                  >
                    <UserPlus size={15} />
                  </div>
                  إضافة مدرس
                </Link>
              )}
              {isSuperAdmin && (
                <Link href="/admin/admins" className="admin-quick-action-btn">
                  <div
                    className="admin-quick-action-icon"
                    style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa" }}
                  >
                    <UserCog size={15} />
                  </div>
                  إدارة الأدمنز
                </Link>
              )}
              {hasCentersPermission && (
                <Link href="/admin/centers" className="admin-quick-action-btn">
                  <div
                    className="admin-quick-action-icon"
                    style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}
                  >
                    <Building2 size={15} />
                  </div>
                  السناتر
                </Link>
              )}
              <Link href="/admin/settings" className="admin-quick-action-btn">
                <div
                  className="admin-quick-action-icon"
                  style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24" }}
                >
                  <Settings size={15} />
                </div>
                إعدادات المنصة
              </Link>
            </div>
          </div>

          {/* Expiring soon list */}
          {adminStats.expiringSoon > 0 && (
            <div className="glass-panel panel-content">
              <h2
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#fbbf24",
                }}
              >
                <Clock size={16} />
                اشتراكات تنتهي قريباً
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {teachers
                  .filter((t) => {
                    if (!t.subscription_expires_at || t.is_super_admin) return false;
                    const diff =
                      (new Date(t.subscription_expires_at).getTime() - now.getTime()) /
                      (1000 * 60 * 60 * 24);
                    return diff >= 0 && diff <= 30;
                  })
                  .sort((a, b) =>
                    new Date(a.subscription_expires_at!).getTime() -
                    new Date(b.subscription_expires_at!).getTime()
                  )
                  .slice(0, 5)
                  .map((t) => {
                    const diff = Math.ceil(
                      (new Date(t.subscription_expires_at!).getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={t.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.5rem 0.75rem",
                          borderRadius: 9,
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {t.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background:
                              diff <= 7
                                ? "rgba(239,68,68,0.15)"
                                : "rgba(245,158,11,0.12)",
                            color: diff <= 7 ? "#f87171" : "#fbbf24",
                            border: `1px solid ${diff <= 7 ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.2)"}`,
                            fontFamily: "monospace",
                          }}
                        >
                          {diff === 0 ? "اليوم" : `${diff} يوم`}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Summary stats card */}
          <div className="glass-panel panel-content">
            <h2
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Calendar size={16} style={{ color: "#a78bfa" }} />
              ملخص الحالة
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                {
                  label: "اشتراكات منتهية",
                  value: expiredTeachers,
                  color: "#f87171",
                  bg: "rgba(239,68,68,0.08)",
                },
                {
                  label: "بانتظار المراجعة",
                  value: pendingTeachers,
                  color: "#fbbf24",
                  bg: "rgba(245,158,11,0.08)",
                },
                {
                  label: "مخفيون عن الأدمن",
                  value: teachers.filter((t) => t.hidden_from_admin).length,
                  color: "#94a3b8",
                  bg: "rgba(148,163,184,0.08)",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.5rem 0.75rem",
                    borderRadius: 9,
                    background: item.value > 0 ? item.bg : "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: item.value > 0 ? item.color : "var(--text-muted)",
                      fontFamily: "monospace",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Teachers Table ── */}
      {teachers.length === 0 ? (
        <div className="glass-panel panel-content" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <Users size={48} style={{ opacity: 0.15, margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>
            لا يوجد مدرسون بعد
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            ابدأ بإضافة أول حساب مدرس لتظهر البيانات هنا.
          </p>
          {isSuperAdmin && (
            <Link href="/admin/teachers" className="btn btn-primary" style={{ display: "inline-flex" }}>
              <UserPlus size={16} />
              إضافة مدرس
            </Link>
          )}
        </div>
      ) : (
        <TeachersTable
          teachers={teachers}
          studentCounts={studentCounts}
          groupCounts={groupCounts}
          isSuperAdmin={isSuperAdmin}
          updatingId={updatingId}
          onToggleActive={handleToggleActive}
          onToggleVisibility={handleToggleVisibility}
          onDeleteTeacher={handleDeleteTeacher}
          onUpdateExpiration={handleUpdateExpiration}
          onUpdateStartDate={handleUpdateStartDate}
          onUpdatePrice={handleUpdatePrice}
          onRenewYear={handleRenewYear}
          onOpenFeatures={(t) => {
            setFeatureModalTeacher(t);
            setBannerMessage("");
            setBannerType(t.banner?.type ?? "info");
          }}
        />
      )}

      {/* ── Features Modal ── */}
      {featureModalTeacher && (
        <FeaturesModal
          teacher={featureModalTeacher}
          updatingId={updatingId}
          bannerMessage={bannerMessage}
          bannerType={bannerType}
          onClose={() => setFeatureModalTeacher(null)}
          onToggleBills={handleToggleBills}
          onToggleAttendance={handleToggleAttendance}
          onToggleCenterMode={handleToggleCenterMode}
          onToggleCentersFeature={handleToggleCentersFeature}
          onUpdateBanner={handleUpdateBanner}
          onToggleActive={handleToggleActive}
          onUpdateStartDate={handleUpdateStartDate}
          onSetTeacher={(t) => setFeatureModalTeacher(t)}
          onSetBannerMessage={setBannerMessage}
          onSetBannerType={setBannerType}
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

      {/* spin keyframe for refresh icon */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
