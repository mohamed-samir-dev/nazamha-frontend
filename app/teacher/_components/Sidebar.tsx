"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SystemSettings } from "@/lib/services/systemSettingsService";
import {
  LayoutDashboard, Users, TrendingUp, Settings, LogOut,
  Shield, Menu, X, ClipboardCheck, FileText, Award, FileQuestion, FolderOpen, BookOpen, Wallet, QrCode, Sparkles, BarChart3,
} from "lucide-react";

interface SidebarProps {
  teacherName: string;
  hasAttendance: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  financialPermissions: string[];
  hasCenterMode: boolean;
  hasCentersFeature: boolean;
  isAssistant?: boolean;
  mobileMenuOpen: boolean;
  sysSettings: SystemSettings | null;
  onToggleMobile: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  teacherName, hasAttendance, isAdmin, isSuperAdmin, financialPermissions,
  hasCenterMode, hasCentersFeature, isAssistant, mobileMenuOpen, sysSettings, onToggleMobile, onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  // Assistants cannot see financial pages
  const canViewRevenue = !isAssistant && (!isAdmin || isSuperAdmin || financialPermissions.includes("financial.viewRevenue"));

  const menuItems = [
    { name: "الرئيسية", path: "/teacher", icon: LayoutDashboard },
    { name: "المجموعات", path: "/teacher/groups", icon: FolderOpen },
    ...(hasCenterMode ? [{ name: "المعلمون", path: "/teacher/teachers", icon: Users }] : []),
    { name: "الطلاب", path: "/teacher/students", icon: Users },
    { name: "بطاقات QR", path: "/teacher/students/print-qr", icon: QrCode },
    { name: "الأخوات", path: "/teacher/siblings", icon: Users },
    ...(!isAssistant ? [{ name: "سكان الدفع", path: "/teacher/students/payment-scan", icon: QrCode }] : []),
    ...(hasAttendance ? [{ name: "الحضور والغياب", path: "/teacher/attendance", icon: ClipboardCheck }] : []),
    ...(hasAttendance ? [{ name: "تقارير الحضور", path: "/teacher/attendance/reports", icon: BarChart3 }] : []),
    { name: "تقارير الطلاب", path: "/teacher/reports/students", icon: FileText },
    ...(canViewRevenue ? [{ name: "التقارير المالية", path: "/teacher/reports", icon: TrendingUp }] : []),
    ...(canViewRevenue ? [{ name: "الرواتب والمصروفات", path: "/teacher/salaries", icon: Wallet }] : []),
    { name: "نماذج الامتحانات", path: "/teacher/exams/generator", icon: FileQuestion },
    { name: "درجات الامتحانات", path: "/teacher/exams", icon: Award },
    { name: "الكتب والمبيعات", path: "/teacher/books", icon: BookOpen },
    { name: "الذكاء الاصطناعي", path: "/teacher/ai", icon: Sparkles },
    ...(hasCentersFeature && !isAssistant ? [{ name: "السناتر", path: "/admin/centers", icon: Shield }] : []),
    ...(!isAssistant ? [{ name: "الإعدادات", path: "/teacher/settings", icon: Settings }] : []),
    ...(isAdmin ? [{ name: "لوحة المدير العام", path: "/admin", icon: Shield }] : []),
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
          <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#ffffff", marginTop: "4px" }}>
            {`أ. ${teacherName}`}
          </p>
          {isAssistant && (
            <p style={{ fontSize: "0.72rem", color: "#f59e0b", marginTop: "2px", fontWeight: 600 }}>مساعد</p>
          )}
          {isAdmin && !isAssistant && (
            <p style={{ fontSize: "0.72rem", color: isSuperAdmin ? "#c084fc" : "#5eead4", marginTop: "2px" }}>
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </p>
          )}
        </div>

        <nav className={`sidebar-menu ${mobileMenuOpen ? "open" : ""}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
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
