"use client";

import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CenterService } from "@/lib/services/centerService";
import { CenterDashboardData } from "@/lib/types";
import {
  GraduationCap, UserCheck, Plus, BarChart3, TrendingUp, TrendingDown,
  Wallet, ArrowLeft, RefreshCw, ChevronRight,
} from "lucide-react";
import { RiTeamLine } from "react-icons/ri";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { MdOutlineTrendingUp } from "react-icons/md";

export const CENTER_DASHBOARD_KEY = "/centers/me/dashboard";

const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

function fmt(n: number) {
  return n.toLocaleString("ar-EG") + " ج.م";
}

function SkeletonCard() {
  return (
    <div className="glass-panel flex items-center gap-5 p-6 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-white/[0.05] shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-3 w-20 rounded bg-white/[0.05]" />
        <div className="h-7 w-16 rounded bg-white/[0.07]" />
        <div className="h-2.5 w-24 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  iconBorder: string;
  sub?: React.ReactNode;
}

function StatCard({ icon, label, value, iconBg, iconColor, iconBorder, sub }: StatCardProps) {
  return (
    <div className="glass-panel flex items-center gap-4 p-5 transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor} ${iconBorder} border`}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[0.8rem] text-slate-400 font-medium mb-0.5 truncate">{label}</span>
        <span className="text-[1.5rem] font-bold leading-none font-mono text-white">{value}</span>
        {sub && <div className="mt-1">{sub}</div>}
      </div>
    </div>
  );
}

const btnCls = "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400 text-[0.83rem] font-semibold no-underline cursor-pointer transition-all duration-250 hover:bg-teal-500/10 hover:border-teal-500/35 hover:text-teal-400 hover:-translate-y-px font-[inherit]";

export default function CenterDashboardPage() {
  const router = useRouter();

  const { data, error, isLoading, mutate: revalidate } = useSWR<CenterDashboardData>(
    CENTER_DASHBOARD_KEY,
    () => CenterService.getDashboard(),
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      errorRetryCount: 2,
    }
  );

  const loading = isLoading;

  const now = new Date();
  const monthName = ARABIC_MONTHS[now.getMonth()];
  const prevMonthName = ARABIC_MONTHS[now.getMonth() === 0 ? 11 : now.getMonth() - 1];
  const dateLabel = now.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (!loading && error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 flex items-center justify-center">
          <HiOutlineOfficeBuilding size={26} />
        </div>
        <p className="text-slate-400 text-sm">تعذر تحميل بيانات لوحة التحكم</p>
        <button className="btn btn-secondary" onClick={() => revalidate()}>
          <RefreshCw size={14} />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    );
  }

  const inactiveTeachers = data ? data.teachers_count - data.active_teachers_count : 0;
  const inactiveAssistants = data ? data.assistants_count - data.active_assistants_count : 0;
  const topTeachers = data?.teachers.slice(0, 5) ?? [];
  const growthPositive = (data?.revenue_growth ?? 0) >= 0;

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-5 border-b border-white/[0.08]">
        <div>
          <h1 className="text-[1.6rem] font-bold mb-1 bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent">
            لوحة التحكم
          </h1>
          <p className="text-sm text-slate-500">
            نظرة عامة على{" "}
            <span className="text-teal-400 font-semibold">
              {loading ? "..." : data?.center?.name || "السنتر"}
            </span>
          </p>
          <p className="text-[0.75rem] text-slate-600 mt-0.5">{dateLabel}</p>
        </div>
        <button
          className={btnCls}
          onClick={() => revalidate()}
          title="تحديث البيانات"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">تحديث</span>
        </button>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={<GraduationCap size={20} />}
              label="المدرسون"
              value={data?.teachers_count ?? 0}
              iconBg="bg-teal-500/10"
              iconColor="text-teal-400"
              iconBorder="border-teal-500/25"
              sub={
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[0.72rem] text-teal-400">{data?.active_teachers_count ?? 0} نشط</span>
                  {inactiveTeachers > 0 && (
                    <span className="text-[0.72rem] text-slate-500">{inactiveTeachers} غير نشط</span>
                  )}
                </div>
              }
            />

            <StatCard
              icon={<RiTeamLine size={20} />}
              label="المساعدون"
              value={data?.assistants_count ?? 0}
              iconBg="bg-violet-500/10"
              iconColor="text-violet-400"
              iconBorder="border-violet-500/25"
              sub={
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[0.72rem] text-violet-400">{data?.active_assistants_count ?? 0} نشط</span>
                  {inactiveAssistants > 0 && (
                    <span className="text-[0.72rem] text-slate-500">{inactiveAssistants} غير نشط</span>
                  )}
                </div>
              }
            />

            <StatCard
              icon={<Wallet size={20} />}
              label={`إيرادات ${monthName}`}
              value={fmt(data?.current_month_revenue ?? 0)}
              iconBg="bg-amber-500/10"
              iconColor="text-amber-400"
              iconBorder="border-amber-500/25"
              sub={
                <span className="text-[0.72rem] text-slate-500">
                  {monthName} {data?.current_year ?? now.getFullYear()}
                </span>
              }
            />

            <div className={`glass-panel flex items-center gap-4 p-5 transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] ${data?.revenue_growth === null ? "" : growthPositive ? "!border-teal-500/20 !bg-teal-500/[0.03]" : "!border-red-500/20 !bg-red-500/[0.03]"}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${data?.revenue_growth === null ? "bg-slate-500/10 text-slate-400 border-slate-500/25" : growthPositive ? "bg-teal-500/10 text-teal-400 border-teal-500/25" : "bg-red-500/10 text-red-400 border-red-500/25"}`}>
                {data?.revenue_growth === null ? (
                  <MdOutlineTrendingUp size={20} />
                ) : growthPositive ? (
                  <TrendingUp size={20} />
                ) : (
                  <TrendingDown size={20} />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[0.8rem] text-slate-400 font-medium mb-0.5">مقارنة بـ{prevMonthName}</span>
                <span className={`text-[1.5rem] font-bold leading-none font-mono ${data?.revenue_growth === null ? "text-slate-500" : growthPositive ? "text-teal-400" : "text-red-400"}`}>
                  {data?.revenue_growth === null
                    ? "—"
                    : `${growthPositive ? "+" : ""}${data?.revenue_growth}%`}
                </span>
                <span className="text-[0.72rem] text-slate-500 mt-1">
                  {prevMonthName}: {fmt(data?.previous_month_revenue ?? 0)}
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div className="glass-panel flex items-center gap-3 px-4 py-3 mb-7 flex-wrap">
        <span className="text-[0.75rem] text-slate-500 font-semibold whitespace-nowrap border-l border-white/[0.08] pl-3 uppercase tracking-wide hidden sm:block">
          إجراءات سريعة
        </span>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <button className={`${btnCls} flex-1 sm:flex-none justify-center`} onClick={() => router.push("/center/teachers")}>
            <Plus size={15} />
            <span>إضافة مدرس</span>
          </button>
          <button className={`${btnCls} flex-1 sm:flex-none justify-center`} onClick={() => router.push("/center/assistants")}>
            <UserCheck size={15} />
            <span>إضافة مساعد</span>
          </button>
          <Link href="/center/reports/financial" className={`${btnCls} flex-1 sm:flex-none justify-center`}>
            <BarChart3 size={15} />
            <span>التقارير المالية</span>
          </Link>
        </div>
      </div>

      {/* ── Two-column layout: Teachers table + Top earners ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

        {/* Teachers Table */}
        <div className="glass-panel overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
            <h2 className="flex items-center gap-2 text-[0.95rem] font-semibold">
              <GraduationCap size={16} className="text-teal-400" />
              <span>المدرسون</span>
            </h2>
            <Link
              href="/center/teachers"
              className="flex items-center gap-1 text-[0.78rem] text-slate-500 hover:text-teal-400 transition-colors"
            >
              <span>عرض الكل</span>
              <ArrowLeft size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-10 rounded-lg bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : topTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-500">
              <GraduationCap size={36} className="opacity-20" />
              <p className="text-sm">لا يوجد مدرسون حتى الآن</p>
              <button className="btn btn-primary text-sm" onClick={() => router.push("/center/teachers")}>
                <Plus size={14} />
                <span>إضافة مدرس</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="students-table" style={{ minWidth: 480 }}>
                <thead>
                  <tr>
                    <th>المدرس</th>
                    <th style={{ textAlign: "center" }}>المساعدون</th>
                    <th style={{ textAlign: "center" }}>الطلاب</th>
                    <th style={{ textAlign: "center" }}>إيرادات {monthName}</th>
                    <th style={{ textAlign: "center" }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {topTeachers.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                            <GraduationCap size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[0.85rem] text-white leading-tight truncate">{t.name}</p>
                            {t.subject && <p className="text-[0.7rem] text-slate-500 truncate">{t.subject}</p>}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="text-[0.85rem] text-slate-400 font-mono">{t.assistants_count}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="text-[0.85rem] text-slate-400 font-mono">{t.students_count}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="text-[0.82rem] font-semibold text-amber-400 font-mono whitespace-nowrap">
                          {fmt(t.current_month_revenue)}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: "999px",
                          background: t.is_active ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                          color: t.is_active ? "#4ade80" : "#f87171",
                          border: `1px solid ${t.is_active ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                          whiteSpace: "nowrap",
                        }}>
                          {t.is_active ? "نشط" : "معطل"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: Top earners + Financial summary */}
        <div className="flex flex-col gap-4">

          {/* Top earners */}
          <div className="glass-panel overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.07]">
              <TrendingUp size={15} className="text-amber-400" />
              <h2 className="text-[0.9rem] font-semibold">أعلى المدرسين إيرادًا</h2>
            </div>
            {loading ? (
              <div className="p-4 flex flex-col gap-2.5">
                {[1,2,3].map(i => <div key={i} className="h-9 rounded-lg bg-white/[0.03] animate-pulse" />)}
              </div>
            ) : topTeachers.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">لا توجد بيانات مالية</p>
            ) : (
              <div className="p-3 flex flex-col gap-1.5">
                {topTeachers.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-amber-500/[0.04] hover:border-amber-500/15 transition-all duration-200">
                    <span className="text-[0.7rem] font-bold text-slate-600 font-mono w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.82rem] font-semibold text-white truncate">{t.name}</p>
                      {t.subject && <p className="text-[0.68rem] text-slate-500 truncate">{t.subject}</p>}
                    </div>
                    <span className="text-[0.76rem] font-bold text-amber-400 font-mono whitespace-nowrap">
                      {fmt(t.current_month_revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial summary */}
          <div className="glass-panel overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.07]">
              <Wallet size={15} className="text-teal-400" />
              <h2 className="text-[0.9rem] font-semibold">الأداء المالي</h2>
            </div>
            {loading ? (
              <div className="p-4 flex flex-col gap-2.5">
                {[1,2,3].map(i => <div key={i} className="h-8 rounded-lg bg-white/[0.03] animate-pulse" />)}
              </div>
            ) : (
              <div className="p-4 flex flex-col gap-2">
                {[
                  { label: `إيرادات ${monthName}`, value: fmt(data?.current_month_revenue ?? 0), color: "text-teal-400" },
                  { label: `إيرادات ${prevMonthName}`, value: fmt(data?.previous_month_revenue ?? 0), color: "text-slate-300" },
                  {
                    label: "نسبة النمو",
                    value: data?.revenue_growth === null ? "—" : `${growthPositive ? "+" : ""}${data?.revenue_growth}%`,
                    color: data?.revenue_growth === null ? "text-slate-500" : growthPositive ? "text-teal-400" : "text-red-400",
                  },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[0.78rem] text-slate-400">{row.label}</span>
                    <span className={`text-[0.82rem] font-bold font-mono ${row.color}`}>{row.value}</span>
                  </div>
                ))}
                <Link
                  href="/center/reports/financial"
                  className="mt-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-400 text-[0.78rem] font-semibold hover:bg-teal-500/10 hover:border-teal-500/30 hover:text-teal-400 transition-all duration-200 no-underline"
                >
                  <BarChart3 size={13} />
                  <span>التقرير المالي الكامل</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
