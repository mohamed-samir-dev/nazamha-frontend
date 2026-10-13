"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, UserCheck, BarChart3, Settings, LogOut, Menu, X } from "lucide-react";

interface CenterSidebarProps {
  centerName: string;
  mobileMenuOpen: boolean;
  onToggleMobile: () => void;
  onLogout: () => void;
}

export default function CenterSidebar({ centerName, mobileMenuOpen, onToggleMobile, onLogout }: CenterSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "الرئيسية", path: "/center", icon: LayoutDashboard },
    { name: "المدرسون", path: "/center/teachers", icon: GraduationCap },
    { name: "المساعدون", path: "/center/assistants", icon: UserCheck },
    { name: "التقارير المالية", path: "/center/reports/financial", icon: BarChart3 },
    { name: "الإعدادات", path: "/center/settings", icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="sidebar-top-row">
          <div className="sidebar-logo" />
          <button className="hamburger-btn" onClick={onToggleMobile} aria-label="القائمة">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className={`sidebar-profile ${mobileMenuOpen ? "open" : ""}`}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>أهلاً بك،</p>
          <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#ffffff", marginTop: "4px" }}>{centerName}</p>
          <p style={{ fontSize: "0.72rem", color: "#5eead4", marginTop: "2px" }}>مدير السنتر</p>
        </div>

        <nav className={`sidebar-menu ${mobileMenuOpen ? "open" : ""}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/center"
              ? pathname === "/center"
              : pathname.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path} className={`sidebar-link ${isActive ? "active" : ""}`}>
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {mobileMenuOpen && (
          <button className="btn btn-secondary sidebar-logout-mobile open" onClick={onLogout}>
            <LogOut size={16} /><span>تسجيل الخروج</span>
          </button>
        )}

        <div className="sidebar-logout-desktop">
          <button className="btn btn-secondary" onClick={onLogout} style={{ width: "100%", justifyContent: "center" }}>
            <LogOut size={16} /><span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
