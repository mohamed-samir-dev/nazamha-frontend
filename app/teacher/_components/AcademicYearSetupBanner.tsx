"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ArrowLeft, Settings, X, AlertCircle } from "lucide-react";

interface Props {
  teacherId?: string;
}

export function AcademicYearSetupBanner({ teacherId }: Props) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!teacherId) return;
    try {
      const isDismissed = sessionStorage.getItem(`hide_academic_setup_banner_${teacherId}`);
      if (isDismissed === "true") {
        setDismissed(true);
      }
    } catch {
      // Ignore storage errors in restricted webviews
    }
  }, [teacherId]);

  const handleDismiss = () => {
    setDismissed(true);
    if (teacherId) {
      try {
        sessionStorage.setItem(`hide_academic_setup_banner_${teacherId}`, "true");
      } catch {
        // Ignore
      }
    }
  };

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden mb-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-teal-500/10 p-4 md:p-5 shadow-lg backdrop-blur-sm">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Content Section */}
        <div className="flex items-start gap-3.5 flex-1">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow-sm mt-0.5 md:mt-0">
            <Calendar size={20} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <AlertCircle size={12} />
                خطوة البداية الأولى
              </span>
              <h3 className="text-sm md:text-base font-bold text-slate-100">
                يرجى تحديد شهور السنة الدراسية التي ستعمل بها
              </h3>
            </div>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
              قبل البدء في إضافة المجموعات والطلاب، توجه إلى <strong className="text-amber-300 font-semibold">الإعدادات</strong> لتحديد شهور العمل. يُرجى اختيار الشهور <strong className="text-white font-semibold">بعناية</strong> لأنها الأساس الذي تُبنى عليه الاشتراكات الشهرية والتقارير المالية للطلاب.
            </p>
          </div>
        </div>

        {/* Action Button & Dismiss */}
        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
          <Link
            href="/teacher/settings"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs md:text-sm transition-all shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 group"
          >
            <Settings size={16} className="transition-transform group-hover:rotate-45" />
            <span>الانتقال للإعدادات</span>
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            title="إخفاء التنبيه مؤقتاً"
            aria-label="إخفاء التنبيه"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer bg-transparent border-0"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
