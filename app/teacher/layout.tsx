"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthService } from "@/lib/services/authService";
import { SystemSettingsService, SystemSettings } from "@/lib/services/systemSettingsService";
import { cairoClock } from "@/lib/dashboardUtils";
import { api } from "@/lib/apiClient";
import { OfflineCache } from "@/lib/offlineQueue";
import Sidebar from "./_components/Sidebar";
import { PendingScreen, BlockedScreen } from "./_components/StatusScreens";
import { DashboardContext, DashboardData } from "@/lib/DashboardContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isPrintPage = typeof window !== "undefined" && /\/print(\/|$)/.test(window.location.pathname);
  const [loading, setLoading] = useState(!isPrintPage);
  const [teacherName, setTeacherName] = useState("");
  const [hasBills, setHasBills] = useState(true);
  const [hasAttendance, setHasAttendance] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [financialPermissions, setFinancialPermissions] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sysSettings, setSysSettings] = useState<SystemSettings | null>(null);
  const [hasCenterMode, setHasCenterMode] = useState(false);
  const [hasCentersFeature, setHasCentersFeature] = useState(false);
  const [isAssistant, setIsAssistant] = useState(false);
  const dashboardDataRef = useRef<DashboardData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const requestRef = useRef<Promise<DashboardData> | null>(null);
  const [updatedAt, setUpdatedAt] = useState(0);
  const refresh = useCallback((force = true) => {
    if (requestRef.current) return requestRef.current;
    const {month, year} = cairoClock();
    const request = api.get<DashboardData>(`/dashboard?summary=1&month=${month}&year=${year}${force ? "&refresh=1" : ""}`).then(data => {
      dashboardDataRef.current = data;
      setDashboardData(data);
      setDashboardLoading(false);
      setUpdatedAt(Date.now());
      return data;
    }).finally(() => { if (requestRef.current === request) requestRef.current = null; });
    requestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    const clear = () => { requestRef.current = null; dashboardDataRef.current = null; setDashboardData(null); setUpdatedAt(0); setDashboardLoading(true); };
    window.addEventListener("account-cache-cleared", clear);
    return () => window.removeEventListener("account-cache-cleared", clear);
  }, []);

  useEffect(() => {
    if (pathname === "/teacher/login" || pathname?.includes("/print")) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    function applyTeacherData(teacherData: any) {
      setTeacherName(teacherData.name || "المعلم");
      setHasCenterMode(teacherData.is_center_mode === true);
      setHasBills(teacherData.has_bills_feature !== false);
      setHasAttendance(teacherData.has_attendance_feature !== false);
      setHasCentersFeature(teacherData.has_centers_feature === true);
      setIsAdmin(teacherData.is_admin === true);
      setIsSuperAdmin(teacherData.is_super_admin === true);
      setFinancialPermissions(teacherData.financial_permissions || []);
      setIsAssistant(!!(teacherData.effective_teacher_id));

      const active = teacherData.is_active !== false;
      const expired = teacherData.subscription_expires_at
        ? new Date(teacherData.subscription_expires_at) < new Date()
        : false;

      if (!active) {
        if (!teacherData.subscription_started_at) setIsPending(true);
        else setIsBlocked(true);
      } else if (expired) {
        setIsBlocked(true);
      }

      if (pathname.startsWith("/teacher/attendance") && teacherData.has_attendance_feature === false) { router.replace("/teacher"); return; }
      if (pathname === "/teacher/teachers" && !teacherData.is_center_mode) { router.replace("/teacher"); return; }
      const assistantFlag = !!(teacherData.effective_teacher_id);
      if (assistantFlag && (pathname === "/teacher/reports" || pathname === "/teacher/bills" || pathname === "/teacher/salaries")) {
        router.replace("/teacher"); return;
      }
    }

    async function checkSession() {
      try {
        const now = new Date();
        let teacher: any;

        if (pathname === "/teacher") {
          // لو عندنا داتا محفوظة، ابعتها فوراً عشان الداشبورد ما يتصفرش
          if (dashboardDataRef.current) {
            setDashboardData(dashboardDataRef.current);
            setDashboardLoading(false);
          }
          const dash = await refresh();
          if (cancelled) return;
          teacher = dash.teacher;
          dashboardDataRef.current = dash;
          setDashboardData(dash);
          setDashboardLoading(false);
        } else {
          const cached = OfflineCache.loadTeacher();
          if (cached) {
            applyTeacherData(cached as any);
            setLoading(false);
          }
          if (dashboardDataRef.current) {
            setDashboardData(dashboardDataRef.current);
            setDashboardLoading(false);
          }
          teacher = await AuthService.getUser();
          if (cancelled) return;
          // لو getUser() أرجع null بدون throw، معناها network error — نكمل بالـ cache
          if (!teacher) {
            const fallbackCached = OfflineCache.loadTeacher();
            if (fallbackCached?.id) {
              teacher = fallbackCached;
            }
          }
          if (!dashboardDataRef.current) {
            setDashboardLoading(false);
            if (teacher) {
              const fallback = { teacher, grades: [], groups: [], students: [], subscriptions: [], attendance: [] };
              dashboardDataRef.current = fallback;
              setDashboardData(fallback);
            }
          }
        }
        if (!teacher) throw new Error("no-user");

        const ut = (teacher as any).user_type;
        if (ut && ut !== "teacher" && !(ut === "staff" && (teacher as any).teacher_id)) {
          router.replace("/teacher/login");
          return;
        }

        OfflineCache.saveTeacher(teacher as any);
        applyTeacherData(teacher);

        // Load cached settings immediately, then refresh in background
        const cachedSettings = OfflineCache.loadSysSettings();
        if (cachedSettings) setSysSettings(cachedSettings);
        SystemSettingsService.getSettings().then(settings => {
          if (cancelled || !settings) return;
          setSysSettings(settings);
          OfflineCache.saveSysSettings(settings);
        }).catch(() => {});
      } catch (err: unknown) {
        if (cancelled) return;

        // 401 / auth errors: clear all user data and redirect to login
        const isAuthError =
          (err instanceof Error && (err as any).status === 401) ||
          (err instanceof Error && err.message === "no-user");

        if (isAuthError) {
          AuthService.clearAllUserData();
          router.replace("/teacher/login");
          return;
        }

        // Network / server errors: fall back to offline cache so user
        // can keep working without losing their session context
        const cached = OfflineCache.loadTeacher();
        if (!cached) {
          router.replace("/teacher/login");
          return;
        }
        applyTeacherData(cached as any);
        const cachedSettings = OfflineCache.loadSysSettings();
        if (cachedSettings) setSysSettings(cachedSettings);
        setDashboardLoading(false);
      }
      if (!cancelled) setLoading(false);
    }

    checkSession();
    return () => { cancelled = true; };
  }, [router, pathname]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.name) setTeacherName(detail.name);
    };
    window.addEventListener("teacher-profile-updated", handler);
    return () => window.removeEventListener("teacher-profile-updated", handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await AuthService.signOut();
    router.replace("/teacher/login");
  };

  if (pathname === "/teacher/login" || /\/print(\/|$)/.test(pathname ?? "")) return <>{children}</>;

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isPending) return <PendingScreen onLogout={handleLogout} />;
  if (isBlocked) return <BlockedScreen onLogout={handleLogout} />;

  return (
    <div className="dashboard-layout">
      <Sidebar
        teacherName={teacherName}
        hasAttendance={hasAttendance}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        financialPermissions={financialPermissions}
        hasCenterMode={hasCenterMode}
        hasCentersFeature={hasCentersFeature}
        isAssistant={isAssistant}
        mobileMenuOpen={mobileMenuOpen}
        sysSettings={sysSettings}
        onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
        onLogout={handleLogout}
      />

      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <main className="content-area">
        <DashboardContext.Provider value={{ data: dashboardData, loading: dashboardLoading, refresh, updatedAt }}>
          <div key={pathname}>
            {children}
          </div>
        </DashboardContext.Provider>
      </main>
    </div>
  );
}
