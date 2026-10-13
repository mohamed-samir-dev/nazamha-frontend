"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { AuthService } from "@/lib/services/authService";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  superAdminOnly?: boolean;
  centersOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface Props {
  isSuperAdmin: boolean;
  hasCentersPermission: boolean;
  siteName?: string;
}

export default function AdminSidebar({ isSuperAdmin, hasCentersPermission, siteName }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      const sidebar = document.getElementById("admin-sidebar");
      if (sidebar && !sidebar.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  const handleLogout = async () => {
    await AuthService.signOut();
    router.replace("/admin/login");
  };

  const navGroups: NavGroup[] = [
    {
      label: "الرئيسية",
      items: [
        {
          href: "/admin",
          label: "لوحة التحكم",
          icon: <LayoutDashboard size={17} />,
        },
      ],
    },
    {
      label: "الإدارة",
      items: [
        {
          href: "/admin/teachers",
          label: "المدرسون",
          icon: <Users size={17} />,
          superAdminOnly: true,
        },
        {
          href: "/admin/centers",
          label: "السناتر",
          icon: <Building2 size={17} />,
          centersOnly: true,
        },
      ],
    },
    {
      label: "النظام",
      items: [
        {
          href: "/admin/settings",
          label: "إعدادات المنصة",
          icon: <Settings size={17} />,
        },
        {
          href: "/admin/admins",
          label: "إدارة الأدمنز",
          icon: <UserCog size={17} />,
          superAdminOnly: true,
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const renderItems = (items: NavItem[]) =>
    items
      .filter((item) => {
        if (item.superAdminOnly && !isSuperAdmin) return false;
        if (item.centersOnly && !hasCentersPermission) return false;
        return true;
      })
      .map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`admin-sidebar-link ${isActive(item.href) ? "active" : ""}`}
        >
          <span className="admin-sidebar-link-icon">{item.icon}</span>
          <span>{item.label}</span>
          {isActive(item.href) && (
            <ChevronLeft size={14} className="mr-auto opacity-60" />
          )}
        </Link>
      ));

  const sidebarContent = (
    <div className="admin-sidebar-inner">
      {/* Logo / Brand */}
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-brand-icon">
          <Shield size={20} />
        </div>
        <div className="admin-sidebar-brand-text">
          <span className="admin-sidebar-brand-name">
            {siteName || "لوحة التحكم"}
          </span>
          <span className="admin-sidebar-brand-role">
            {isSuperAdmin ? "Super Admin" : "Admin"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="admin-sidebar-nav">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.superAdminOnly && !isSuperAdmin) return false;
            if (item.centersOnly && !hasCentersPermission) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="admin-sidebar-group">
              <p className="admin-sidebar-group-label">{group.label}</p>
              {renderItems(group.items)}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="admin-sidebar-footer">
        <button onClick={handleLogout} className="admin-sidebar-logout">
          <LogOut size={16} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside id="admin-sidebar" className="admin-sidebar-desktop">
        {sidebarContent}
      </aside>

      {/* Mobile: Top Bar */}
      <div className="admin-mobile-bar">
        <div className="admin-mobile-bar-inner">
          <button
            className="admin-mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="القائمة"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="admin-mobile-brand">
            <Shield size={16} className="text-violet-400" />
            <span>{siteName || "لوحة التحكم"}</span>
          </div>
          <span className="admin-mobile-role-badge">
            {isSuperAdmin ? "Super Admin" : "Admin"}
          </span>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <>
            <div
              className="admin-mobile-overlay"
              onClick={() => setMobileOpen(false)}
            />
            <div className="admin-mobile-drawer">
              {sidebarContent}
            </div>
          </>
        )}
      </div>
    </>
  );
}
