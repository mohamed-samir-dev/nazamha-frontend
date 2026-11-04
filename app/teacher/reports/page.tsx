"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AlertCircle, BarChart3, BookOpen, GraduationCap, Info } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

import { ReportsFiltersBar } from "./_components/ReportsFiltersBar";
import { ReportsSummaryCards } from "./_components/ReportsSummaryCards";
import { DailyRevenueChart } from "./_components/DailyRevenueChart";
import { InsightsStrip } from "./_components/InsightsStrip";
import { FinancialTablesSection } from "./_components/FinancialTablesSection";
import { StageDetailsModal } from "./_components/StageDetailsModal";
import { UnpaidStudentsModal } from "./_components/UnpaidStudentsModal";
import { PrintPreviewModal } from "./_components/PrintPreviewModal";

import { useFinancialReports, ARABIC_MONTHS } from "./_hooks/useFinancialReports";
import type { StageRevenueRow } from "./_types/financialTypes";

export default function ReportsPage() {
  const {
    loading,
    error,
    teacherProfile,
    grades,
    groups,
    subTeachers,
    filteredStudents,
    hasCenterMode,
    CURRENT_YEAR,
    CURRENT_MONTH,
    // Filter states
    periodType,
    setPeriodType,
    selectedAcademicYear,
    setSelectedAcademicYear,
    academicYearOptions,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedGradeId,
    setSelectedGradeId,
    selectedGroupId,
    setSelectedGroupId,
    selectedTeacherId,
    setSelectedTeacherId,
    resetFilters,
    // Computed period data
    dateBounds,
    kpis,
    // Daily revenue points for chart
    dailyRevenuePoints,
    // The 5 Numerical Tables
    monthlySummary,
    stageRevenue,
    groupRevenue,
    paymentTransactions,
    outstandingStudents,
    // Existing Preserved Features
    topGrade,
    topBook,
    unpaidStudents,
    gradesStats,
    booksStats,
    // Legacy metrics for backwards compatibility & trend calculations
    totalSubscriptionEarnings,
    totalBookEarnings,
    totalExpenses,
    totalGrossEarnings,
    totalNetProfit,
    prevMonthSubEarnings,
    prevMonthBookEarnings,
    prevMonthExpenses,
    prevMonthGrossEarnings,
    prevMonthNetProfit,
    // Modals
    showUnpaid,
    setShowUnpaid,
    showAllGrades,
    setShowAllGrades,
    showAllBooks,
    setShowAllBooks,
    showPrintPreview,
    setShowPrintPreview,
    // Export actions
    handlePrintStatement,
  } = useFinancialReports();

  // Selected stage for detail modal
  const [inspectedStage, setInspectedStage] = useState<StageRevenueRow | null>(null);

  if (loading) return <Spinner fullScreen />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingBottom: "2rem" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(20,184,166,0.1)",
              border: "1px solid rgba(20,184,166,0.25)",
              color: "var(--color-teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "clamp(1.25rem,3vw,1.75rem)", marginBottom: "0.1rem", fontWeight: 800 }}>
              التقارير المالية والتحليلات
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "clamp(0.75rem,1.5vw,0.85rem)", margin: 0 }}>
              إيرادات الاشتراكات · أرباح الكتب · المصروفات · نسبة التحصيل · سجل المعاملات
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.6rem",
            padding: "0.65rem 1rem",
            borderRadius: 10,
            background: "rgba(59,130,246,0.06)",
            border: "1px solid rgba(59,130,246,0.15)",
            fontSize: "0.78rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          <Info size={14} style={{ color: "#60a5fa", flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong style={{ color: "var(--color-teal)" }}>المحصل الفعلي</strong> = المبالغ المستلمة فعلياً بناءً على تواريخ الدفع ·{" "}
            <strong style={{ color: "#60a5fa" }}>المستحق</strong> = الالتزامات المستحقة للشهور المفعلة للطلاب المسجلين ·{" "}
            <strong style={{ color: "#f87171" }}>المتأخرات</strong> = المستحقات التي حل موعدها ولم تُسدد ·{" "}
            <strong style={{ color: "#10b981" }}>صافي الأرباح</strong> = الإيرادات المحصلة − المصروفات
          </span>
        </div>
      </div>

      {/* ── Filters Bar (Current Month First) ── */}
      <ReportsFiltersBar
        periodType={periodType}
        setPeriodType={setPeriodType}
        selectedAcademicYear={selectedAcademicYear}
        setSelectedAcademicYear={setSelectedAcademicYear}
        academicYearOptions={academicYearOptions}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedGradeId={selectedGradeId}
        setSelectedGradeId={setSelectedGradeId}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        selectedTeacherId={selectedTeacherId}
        setSelectedTeacherId={setSelectedTeacherId}
        grades={grades}
        groups={groups}
        subTeachers={subTeachers}
        hasCenterMode={hasCenterMode}
        totalStudentsCount={filteredStudents.length}
        periodLabel={dateBounds.label}
        onResetFilters={resetFilters}
        onPrint={handlePrintStatement}
      />

      {error && (
        <div className="alert-toast alert-error" style={{ marginBottom: "1rem" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Section 3: Financial KPI Cards ── */}
      <ReportsSummaryCards
        kpis={kpis}
        totalNetProfit={totalNetProfit}
        totalGrossEarnings={totalGrossEarnings}
        totalExpenses={totalExpenses}
        totalBookEarnings={totalBookEarnings}
        currentMonthNetProfit={kpis.netProfit}
        currentMonthGrossEarnings={kpis.totalCollected}
        currentMonthExpenses={kpis.totalExpenses}
        currentMonthBookEarnings={kpis.bookCollected}
        prevMonthNetProfit={prevMonthNetProfit}
        prevMonthGrossEarnings={prevMonthGrossEarnings}
        prevMonthExpenses={prevMonthExpenses}
        prevMonthBookEarnings={prevMonthBookEarnings}
        currentMonthName={ARABIC_MONTHS[CURRENT_MONTH]}
        periodLabel={dateBounds.label}
      />

      {/* ── Section 4: Daily Revenue Analysis Chart ── */}
      <DailyRevenueChart
        isSingleMonth={dateBounds.isSingleMonth}
        dailyPoints={dailyRevenuePoints}
        monthlySummary={monthlySummary}
        periodLabel={dateBounds.label}
      />

      {/* ── Section 6: Existing Features Preserved & Enhanced ── */}
      <InsightsStrip
        topGrade={topGrade}
        unpaidCount={kpis.unpaidStudentsCount}
        topBook={topBook}
        totalStudents={kpis.totalEligibleStudents}
        currentMonthName={dateBounds.label}
        onShowUnpaid={() => setShowUnpaid(true)}
      />

      {/* Preserved Side-by-Side Breakdown Cards (Stages & Books) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: "1.25rem",
          margin: "1.25rem 0",
        }}
      >
        {/* Feature 6.D: Subscription Revenue by Educational Stage */}
        <div className="glass-panel panel-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 className="panel-title" style={{ margin: 0 }}>
              <GraduationCap size={18} style={{ color: "var(--color-info)" }} />
              <span>إيرادات الاشتراكات حسب السنة الدراسية</span>
            </h2>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{dateBounds.label}</span>
          </div>

          {gradesStats.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا توجد بيانات للمراحل الدراسية في هذه الفترة</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(showAllGrades ? gradesStats : gradesStats.slice(0, 4)).map((g, idx) => (
                <div
                  key={g.id}
                  onClick={() => {
                    const found = stageRevenue.find((sr) => sr.id === g.id);
                    if (found) setInspectedStage(found);
                  }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "0.6rem",
                    borderBottom:
                      idx !== Math.min(gradesStats.length, showAllGrades ? gradesStats.length : 4) - 1
                        ? "1px solid var(--border-color)"
                        : "none",
                    cursor: "pointer",
                  }}
                  title="اضغط لعرض تفاصيل المجموعات والطلاب"
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.88rem", margin: 0 }}>{g.name}</p>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2, margin: 0 }}>
                      {g.paidThisMonth} طالب دفعوا {dateBounds.label}
                    </p>
                  </div>
                  <span className="monospace" style={{ fontWeight: 700, color: "var(--color-teal)" }}>
                    {g.earnings.toLocaleString()} ج.م
                  </span>
                </div>
              ))}
              {gradesStats.length > 4 && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
                  onClick={() => setShowAllGrades((v) => !v)}
                >
                  {showAllGrades ? "عرض أقل" : `عرض الكل (${gradesStats.length})`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feature 6.E: Book Sales Revenue */}
        <div className="glass-panel panel-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 className="panel-title" style={{ margin: 0 }}>
              <BookOpen size={18} style={{ color: "var(--color-amber)" }} />
              <span>أرباح ومبيعات الكتب</span>
            </h2>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{dateBounds.label}</span>
          </div>

          {booksStats.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا توجد مبيعات كتب مسجلة في هذه الفترة</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(showAllBooks ? booksStats : booksStats.slice(0, 4)).map((b, idx) => (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "0.6rem",
                    borderBottom:
                      idx !== Math.min(booksStats.length, showAllBooks ? booksStats.length : 4) - 1
                        ? "1px solid var(--border-color)"
                        : "none",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.88rem", margin: 0 }}>{b.name}</p>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2, margin: 0 }}>
                      {b.count} نسخة · سعر النسخة {b.price.toLocaleString()} ج.م
                    </p>
                  </div>
                  <span className="monospace" style={{ fontWeight: 700, color: "var(--color-amber)" }}>
                    {b.earnings.toLocaleString()} ج.م
                  </span>
                </div>
              ))}
              {booksStats.length > 4 && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
                  onClick={() => setShowAllBooks((v) => !v)}
                >
                  {showAllBooks ? "عرض أقل" : `عرض الكل (${booksStats.length})`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 5: The 5 Financial Numerical Tables ── */}
      <FinancialTablesSection
        monthlySummary={monthlySummary}
        stageRevenue={stageRevenue}
        groupRevenue={groupRevenue}
        paymentTransactions={paymentTransactions}
        outstandingStudents={outstandingStudents}
        onSelectStage={(st) => setInspectedStage(st)}
        periodLabel={dateBounds.label}
      />

      {/* ── Modals ── */}
      {/* Unpaid Students Modal */}
      <UnpaidStudentsModal
        isOpen={showUnpaid}
        onClose={() => setShowUnpaid(false)}
        students={unpaidStudents}
        currentMonthName={dateBounds.label}
      />

      {/* Educational Stage Detail Inspection Modal */}
      <StageDetailsModal
        stage={inspectedStage}
        onClose={() => setInspectedStage(null)}
        groups={groupRevenue}
        outstandingStudents={outstandingStudents}
      />

      {/* All Grades Modal */}
      <Modal
        isOpen={showAllGrades}
        onClose={() => setShowAllGrades(false)}
        title="جميع إيرادات المراحل الدراسية"
        maxWidth="600px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {gradesStats.map((g, idx) => (
            <div
              key={g.id}
              className="flex-between"
              style={{
                borderBottom: idx !== gradesStats.length - 1 ? "1px solid var(--border-color)" : "none",
                paddingBottom: "0.5rem",
              }}
            >
              <div>
                <p style={{ fontWeight: 600 }}>{g.name}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {g.paidThisMonth} طالب دفعوا {dateBounds.label}
                </p>
              </div>
              <span className="monospace" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {g.earnings.toLocaleString()} ج.م
              </span>
            </div>
          ))}
        </div>
      </Modal>

      {/* All Books Modal */}
      <Modal
        isOpen={showAllBooks}
        onClose={() => setShowAllBooks(false)}
        title="جميع مبيعات الكتب"
        maxWidth="600px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {booksStats.map((b, idx) => (
            <div
              key={b.id}
              className="flex-between"
              style={{
                borderBottom: idx !== booksStats.length - 1 ? "1px solid var(--border-color)" : "none",
                paddingBottom: "0.5rem",
              }}
            >
              <div>
                <p style={{ fontWeight: 600 }}>{b.name}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {b.count} نسخة · {b.price.toLocaleString()} ج.م للنسخة
                </p>
              </div>
              <span className="monospace" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {b.earnings.toLocaleString()} ج.م
              </span>
            </div>
          ))}
        </div>
      </Modal>
      {/* Print Preview In-Page Modal */}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        kpis={kpis}
        periodLabel={dateBounds.label}
        teacherName={teacherProfile?.name}
        totalStudentsCount={filteredStudents.length}
        monthlySummary={monthlySummary}
        stageRevenue={stageRevenue}
        groupRevenue={groupRevenue}
        outstandingStudents={outstandingStudents}
        topBook={topBook}
      />
    </div>
  );
}
