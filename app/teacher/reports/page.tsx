"use client";

import { useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { AlertCircle, BarChart3, Filter, BookOpen, GraduationCap, Info } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

import { ReportsSummaryCards } from "./_components/ReportsSummaryCards";
import { InsightsStrip } from "./_components/InsightsStrip";
import { MonthlyTable } from "./_components/MonthlyTable";
import { UnpaidStudentsModal } from "./_components/UnpaidStudentsModal";

import { useFinancialReports, ARABIC_MONTHS } from "./_hooks/useFinancialReports";

export default function ReportsPage() {
  const {
    loading, error,
    grades, groups, subTeachers, filteredStudents,
    selectedYear, setSelectedYear,
    selectedTeacherId, setSelectedTeacherId,
    hasCenterMode,
    CURRENT_YEAR, CURRENT_MONTH,
    totalSubscriptionEarnings, totalBookEarnings,
    totalExpenses, totalGrossEarnings, totalNetProfit,
    prevMonthSubEarnings, prevMonthBookEarnings,
    prevMonthExpenses, prevMonthGrossEarnings, prevMonthNetProfit,
    gradesStats, booksStats, unpaidStudents, monthsReport,
    showUnpaid, setShowUnpaid,
    showAllGrades, setShowAllGrades,
    showAllBooks, setShowAllBooks,
  } = useFinancialReports();

  if (loading) return <Spinner fullScreen />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)",
            color: "var(--color-teal)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "clamp(1.25rem,3vw,1.75rem)", marginBottom: "0.1rem" }}>التقارير المالية</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "clamp(0.75rem,1.5vw,0.85rem)" }}>
              إيرادات الاشتراكات · أرباح الكتب · المصروفات · صافي الأرباح
            </p>
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "flex-start", gap: "0.6rem",
          padding: "0.65rem 1rem", borderRadius: 10, marginBottom: "0.875rem",
          background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
          fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6,
        }}>
          <Info size={14} style={{ color: "#60a5fa", flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong style={{ color: "var(--color-teal)" }}>الإيرادات</strong> = مجموع سجلات الدفع الفعلية (بعد الخصومات) ·{" "}
            <strong style={{ color: "var(--color-amber)" }}>الكتب</strong> = مجموع مبيعات الكتب المسجلة ·{" "}
            <strong style={{ color: "#f87171" }}>المصروفات</strong> = فواتير + رواتب العاملين (تشمل المبالغ المعلقة والالتزامات المتكررة المستقبلية ضمن السنة المختارة، وليست المدفوعات النقدية فقط) ·{" "}
            <strong style={{ color: "#10b981" }}>صافي الأرباح</strong> = الإيرادات + الكتب − المصروفات
          </span>
        </div>

        {/* Filters */}
        <div className="glass-panel reports-filters" style={{ padding: "0.65rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
            <Filter size={13} /><span>فلتر:</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>السنة:</label>
            <select className="form-input" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ padding: "0.3rem 0.6rem", borderRadius: 8, fontSize: "0.82rem", width: "auto" }}>
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {hasCenterMode && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>المعلم:</label>
              <select className="form-input" value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} style={{ padding: "0.3rem 0.6rem", borderRadius: 8, fontSize: "0.82rem", width: "auto" }}>
                <option value="all">الكل</option>
                {subTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div style={{ marginRight: "auto", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {filteredStudents.length} طالب · {ARABIC_MONTHS[CURRENT_MONTH]} {selectedYear}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-toast alert-error" style={{ marginBottom: "1rem" }}>
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      )}

      <ReportsSummaryCards
        totalNetProfit={totalNetProfit}
        totalGrossEarnings={totalGrossEarnings}
        totalExpenses={totalExpenses}
        totalBookEarnings={totalBookEarnings}
        prevMonthNetProfit={prevMonthNetProfit}
        prevMonthGrossEarnings={prevMonthGrossEarnings}
        prevMonthExpenses={prevMonthExpenses}
        prevMonthBookEarnings={prevMonthBookEarnings}
      />

      <InsightsStrip
        topGrade={gradesStats[0] ?? null}
        unpaidCount={unpaidStudents.length}
        topBook={booksStats[0] ?? null}
        totalStudents={filteredStudents.length}
        currentMonthName={ARABIC_MONTHS[CURRENT_MONTH]}
        onShowUnpaid={() => setShowUnpaid(true)}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "1.25rem", margin: "1.25rem 0" }}>
        <div className="glass-panel panel-content">
          <h2 className="panel-title" style={{ marginBottom: "1rem" }}>
            <GraduationCap size={18} style={{ color: "var(--color-info)" }} />
            <span>إيرادات الاشتراكات حسب السنة الدراسية</span>
          </h2>
          {gradesStats.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا توجد بيانات</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(showAllGrades ? gradesStats : gradesStats.slice(0, 4)).map((g, idx) => (
                <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.6rem", borderBottom: idx !== Math.min(gradesStats.length, showAllGrades ? gradesStats.length : 4) - 1 ? "1px solid var(--border-color)" : "none" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.88rem" }}>{g.name}</p>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{g.paidThisMonth} طالب دفعوا {ARABIC_MONTHS[CURRENT_MONTH]}</p>
                  </div>
                  <span className="monospace" style={{ fontWeight: 700, color: "var(--color-teal)" }}>{g.earnings.toLocaleString()} ج.م</span>
                </div>
              ))}
              {gradesStats.length > 4 && (
                <button className="btn btn-secondary" style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }} onClick={() => setShowAllGrades(v => !v)}>
                  {showAllGrades ? "عرض أقل" : `عرض الكل (${gradesStats.length})`}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="glass-panel panel-content">
          <h2 className="panel-title" style={{ marginBottom: "1rem" }}>
            <BookOpen size={18} style={{ color: "var(--color-amber)" }} />
            <span>أرباح مبيعات الكتب</span>
          </h2>
          {booksStats.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا توجد مبيعات كتب مسجلة</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(showAllBooks ? booksStats : booksStats.slice(0, 4)).map((b, idx) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.6rem", borderBottom: idx !== Math.min(booksStats.length, showAllBooks ? booksStats.length : 4) - 1 ? "1px solid var(--border-color)" : "none" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.88rem" }}>{b.name}</p>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{b.count} نسخة · سعر الكتاب {b.price.toLocaleString()} ج.م</p>
                  </div>
                  <span className="monospace" style={{ fontWeight: 700, color: "var(--color-amber)" }}>{b.earnings.toLocaleString()} ج.م</span>
                </div>
              ))}
              {booksStats.length > 4 && (
                <button className="btn btn-secondary" style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }} onClick={() => setShowAllBooks(v => !v)}>
                  {showAllBooks ? "عرض أقل" : `عرض الكل (${booksStats.length})`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <MonthlyTable monthsReport={monthsReport} selectedYear={selectedYear} />

      <UnpaidStudentsModal isOpen={showUnpaid} onClose={() => setShowUnpaid(false)} students={unpaidStudents} currentMonthName={ARABIC_MONTHS[CURRENT_MONTH]} />

      <Modal isOpen={showAllGrades} onClose={() => setShowAllGrades(false)} title="جميع إيرادات الاشتراكات" maxWidth="600px">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {gradesStats.map((g, idx) => (
            <div key={g.id} className="flex-between" style={{ borderBottom: idx !== gradesStats.length - 1 ? "1px solid var(--border-color)" : "none", paddingBottom: "0.5rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>{g.name}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{g.paidThisMonth} طالب دفعوا {ARABIC_MONTHS[CURRENT_MONTH]}</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{g.earnings.toLocaleString()} ج.م</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={showAllBooks} onClose={() => setShowAllBooks(false)} title="جميع أرباح الكتب" maxWidth="600px">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {booksStats.map((b, idx) => (
            <div key={b.id} className="flex-between" style={{ borderBottom: idx !== booksStats.length - 1 ? "1px solid var(--border-color)" : "none", paddingBottom: "0.5rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>{b.name}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{b.count} نسخة · {b.price.toLocaleString()} ج.م للنسخة</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{b.earnings.toLocaleString()} ج.م</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
