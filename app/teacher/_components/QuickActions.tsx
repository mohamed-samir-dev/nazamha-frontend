"use client";

import Link from "next/link";
import { QrCode, UserPlus, TrendingUp, ClipboardList, Users } from "lucide-react";

interface QuickActionsProps {
  hasAttendance: boolean;
  onAddStudent: () => void;
}

const btnCls = "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400 text-[0.83rem] font-semibold no-underline cursor-pointer transition-all duration-250 hover:bg-teal-500/10 hover:border-teal-500/35 hover:text-teal-400 hover:-translate-y-px font-[inherit]";

export function QuickActions({ hasAttendance, onAddStudent }: QuickActionsProps) {
  return (
    <div className="glass-panel flex items-center gap-4 px-5 py-3 mb-6 flex-wrap">
      <span className="text-[0.78rem] text-slate-500 font-semibold whitespace-nowrap border-l border-white/[0.08] pl-4 uppercase tracking-wide">
        إجراءات سريعة
      </span>
      <div className="flex gap-2 flex-wrap">
        {hasAttendance && (
          <Link href="/teacher/attendance/scan" className={btnCls}>
            <QrCode size={15} />
            <span>سكان QR</span>
          </Link>
        )}
        <button className={btnCls} onClick={onAddStudent}>
          <UserPlus size={15} />
          <span>إضافة طالب</span>
        </button>
        <Link href="/teacher/groups" className={btnCls}>
          <Users size={15} />
          <span>إضافة مجموعة</span>
        </Link>
        {hasAttendance && (
          <Link href="/teacher/attendance" className={btnCls}>
            <ClipboardList size={15} />
            <span>سجل الحضور</span>
          </Link>
        )}
        <Link href="/teacher/reports" className={btnCls}>
          <TrendingUp size={15} />
          <span>التقارير</span>
        </Link>
      </div>
    </div>
  );
}
