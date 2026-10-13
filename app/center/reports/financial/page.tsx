"use client";

import { useState } from "react";
import useSWR from "swr";
import { BarChart3, TrendingUp, Users, CreditCard, Trophy } from "lucide-react";
import { CenterService } from "@/lib/services/centerService";
import { CENTER_TEACHERS_KEY } from "@/lib/services/centerService";
import { CenterFinancialReport, CenterTeacher } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";

function fmt(n: number) {
  return n.toLocaleString("ar-EG") + " ج.م";
}

function buildReportKey(teacher_id: string, from: string, to: string) {
  const q = new URLSearchParams();
  if (teacher_id) q.set("teacher_id", teacher_id);
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  const qs = q.toString();
  return `/centers/me/financial-report${qs ? `?${qs}` : ""}`;
}

export default function CenterFinancialReportPage() {
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ── SWR: Teachers — يستفيد من نفس Cache الموجود في صفحة المدرسين ──────────
  const { data: teachers = [] } = useSWR<CenterTeacher[]>(
    CENTER_TEACHERS_KEY,
    () => CenterService.getTeachers(),
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
    }
  );

  // ── SWR: Financial Report — Cache Key يتغير مع الفلاتر ───────────────────
  const reportKey = buildReportKey(filterTeacher, filterFrom, filterTo);

  const { data: report, isLoading: loading, isValidating } = useSWR<CenterFinancialReport>(
    reportKey,
    () => CenterService.getFinancialReport({
      teacher_id: filterTeacher || undefined,
      from: filterFrom || undefined,
      to: filterTo || undefined,
    }),
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      onError: () => setToast({ message: "فشل تحميل التقرير المالي", type: "error" }),
    }
  );

  // أول تحميل بدون بيانات سابقة
  const isFirstLoad = loading && !report;
  // Background refetch مع بيانات موجودة
  const reportLoading = isValidating && !!report;

  const topTeacher = report?.teachers[0] ?? null;
  const avgRevenue = report && report.teachers.length > 0
    ? Math.round(report.totals.revenue / report.teachers.length)
    : 0;

  const isFiltered = !!(filterTeacher || filterFrom || filterTo);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-7 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] rounded-[14px] bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-bold bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent">
              التقارير المالية
            </h1>
            <p className="text-sm text-slate-500">إيرادات المدرسين في السنتر</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel panel-content mb-5">
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ margin: 0, minWidth: 180 }}>
            <label className="form-label">المدرس</label>
            <select className="form-input" style={{ margin: 0 }} value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
              <option value="">كل المدرسين</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">من تاريخ</label>
            <input className="form-input" style={{ margin: 0 }} type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">إلى تاريخ</label>
            <input className="form-input" style={{ margin: 0 }} type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
          </div>
          {isFiltered && (
            <button className="btn btn-secondary" style={{ alignSelf: "flex-end" }} onClick={() => { setFilterTeacher(""); setFilterFrom(""); setFilterTo(""); }}>
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {isFirstLoad ? (
        <div className="loading-wrapper"><div className="spinner" /></div>
      ) : report ? (
        <div style={{ opacity: reportLoading ? 0.5 : 1, transition: "opacity 0.15s", pointerEvents: reportLoading ? "none" : undefined }}>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { label: "إجمالي الإيرادات", value: fmt(report.totals.revenue), icon: TrendingUp, color: "#5eead4" },
              { label: "إجمالي العمليات", value: report.totals.transactions.toLocaleString("ar-EG"), icon: CreditCard, color: "#818cf8" },
              { label: "عدد المدرسين", value: report.teachers.length.toString(), icon: Users, color: "#34d399" },
              { label: "متوسط الإيراد", value: fmt(avgRevenue), icon: BarChart3, color: "#fb923c" },
              ...(topTeacher ? [{ label: "أعلى مدرس إيرادًا", value: topTeacher.name, icon: Trophy, color: "#fbbf24" }] : []),
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-panel panel-content" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Icon size={16} style={{ color: stat.color }} />
                    <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{stat.label}</span>
                  </div>
                  <p style={{ fontSize: stat.label === "أعلى مدرس إيرادًا" ? "1rem" : "1.5rem", fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Teachers Table */}
          <div className="glass-panel overflow-hidden">
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
                تفصيل الإيرادات بالمدرسين
              </h2>
            </div>
            {report.teachers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BarChart3 size={36} className="mx-auto mb-3 opacity-30" />
                <p>لا توجد بيانات مالية للفترة المحددة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="students-table" style={{ minWidth: 650 }}>
                  <thead>
                    <tr>
                      <th>المدرس</th>
                      <th style={{ textAlign: "center" }}>الطلاب</th>
                      <th style={{ textAlign: "center" }}>اشتراكات</th>
                      <th style={{ textAlign: "center" }}>كتب</th>
                      <th style={{ textAlign: "center" }}>إجمالي الإيراد</th>
                      <th style={{ textAlign: "center" }}>العمليات</th>
                      <th style={{ textAlign: "center" }}>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.teachers.map(t => (
                      <tr key={t.id}>
                        <td>
                          <p style={{ fontWeight: 600, margin: 0 }}>{t.name}</p>
                          {t.subject && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>{t.subject}</p>}
                        </td>
                        <td style={{ textAlign: "center", color: "var(--text-secondary)" }}>{t.students_count}</td>
                        <td style={{ textAlign: "center", color: "#5eead4" }}>{fmt(t.subscriptions_revenue)}</td>
                        <td style={{ textAlign: "center", color: "#818cf8" }}>{fmt(t.book_sales_revenue)}</td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "#fbbf24" }}>{fmt(t.total_revenue)}</td>
                        <td style={{ textAlign: "center", color: "var(--text-secondary)" }}>{t.transactions_count}</td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            fontSize: "0.72rem", padding: "0.15rem 0.6rem", borderRadius: "999px",
                            background: t.is_active ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                            color: t.is_active ? "#4ade80" : "#f87171",
                            border: `1px solid ${t.is_active ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                          }}>
                            {t.is_active ? "نشط" : "معطل"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)" }}>
                      <td style={{ fontWeight: 700 }}>الإجمالي</td>
                      <td />
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#5eead4" }}>{fmt(report.totals.subscriptions)}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#818cf8" }}>{fmt(report.totals.book_sales)}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#fbbf24" }}>{fmt(report.totals.revenue)}</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{report.totals.transactions}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
