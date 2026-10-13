"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthService } from "@/lib/services/authService";
import { SystemSettingsService } from "@/lib/services/systemSettingsService";
import { Teacher } from "@/lib/types";
import AdminSidebar from "./_components/AdminSidebar";

/**
 * Admin layout — wraps all /admin/* pages EXCEPT /admin/login.
 * Provides the sidebar and main content area.
 * Login page is excluded via pathname check so it renders without chrome.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<Teacher | null>(null);
  const [siteName, setSiteName] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  // /admin/login must render without sidebar
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const [u, settings] = await Promise.all([
          AuthService.getUser().catch(() => null),
          SystemSettingsService.getSettings().catch(() => null),
        ]);
        if (cancelled) return;
        setUser(u);
        if (settings?.site_name) setSiteName(settings.site_name);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [isLoginPage]);

  // Login page: render bare
  if (isLoginPage) {
    return <>{children}</>;
  }

  // While resolving auth, show nothing (middleware already guards the route)
  if (!ready) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--bg-primary)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid rgba(139,92,246,0.15)",
            borderTopColor: "#a78bfa",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isSuperAdmin = !!(user as Teacher & { is_super_admin?: boolean })?.is_super_admin;
  const hasCentersPermission =
    isSuperAdmin ||
    ((user as Teacher & { financial_permissions?: string[] })?.financial_permissions ?? []).includes("centers.view");

  return (
    <div className="admin-layout">
      <AdminSidebar
        isSuperAdmin={isSuperAdmin}
        hasCentersPermission={hasCentersPermission}
        siteName={siteName}
      />
      <main className="admin-content-area">
        <div key={pathname}>
          {children}
        </div>
      </main>
    </div>
  );
}
