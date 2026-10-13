"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthService } from "@/lib/services/authService";
import CenterSidebar from "./_components/CenterSidebar";

export default function CenterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [centerName, setCenterName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/center/login") { setLoading(false); return; }

    let cancelled = false;
    async function checkSession() {
      try {
        const user = await AuthService.getUser();
        if (!user || cancelled) { router.replace("/center/login"); return; }

        const ut = (user as any).user_type;

        if (ut === "staff" && (user as any).teacher_id) {
          router.replace("/teacher");
          return;
        }

        if (ut !== "center") {
          router.replace("/center/login");
          return;
        }

        if (!cancelled) setCenterName((user as any).name || "السنتر");
      } catch {
        if (!cancelled) {
          AuthService.clearAllUserData();
          router.replace("/center/login");
        }
        return;
      }
      if (!cancelled) setLoading(false);
    }

    checkSession();
    return () => { cancelled = true; };
  }, [router, pathname]);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await AuthService.signOut();
    router.replace("/center/login");
  };

  if (pathname === "/center/login") return <>{children}</>;

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <CenterSidebar
        centerName={centerName}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
        onLogout={handleLogout}
      />

      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <main className="content-area">
        <div key={pathname}>
          {children}
        </div>
      </main>
    </div>
  );
}
