"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  GraduationCap,
  Users,
  CreditCard,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import type {
  MonthlySummaryRow,
  StageRevenueRow,
  GroupRevenueRow,
  PaymentTransactionRow,
  OutstandingStudentRow,
} from "../_types/financialTypes";

interface Props {
  monthlySummary: MonthlySummaryRow[];
  stageRevenue: StageRevenueRow[];
  groupRevenue: GroupRevenueRow[];
  paymentTransactions: PaymentTransactionRow[];
  outstandingStudents: OutstandingStudentRow[];
  onSelectStage: (stage: StageRevenueRow) => void;
  periodLabel: string;
}

export function FinancialTablesSection({
  monthlySummary,
  stageRevenue,
  groupRevenue,
  paymentTransactions,
  outstandingStudents,
  onSelectStage,
  periodLabel,
}: Props) {
  const [activeTab, setActiveTab] = useState<"monthly" | "stages" | "groups" | "transactions" | "outstanding">("monthly");

  // Search & Pagination States
  const [txSearch, setTxSearch] = useState("");
  const [txPage, setTxPage] = useState(1);
  const TX_PER_PAGE = 15;

  const [debtSearch, setDebtSearch] = useState("");
  const [debtPage, setDebtPage] = useState(1);
  const DEBT_PER_PAGE = 15;

  // Sorting state for Groups
  const [groupSortCol, setGroupSortCol] = useState<keyof GroupRevenueRow>("totalCollected");
  const [groupSortAsc, setGroupSortAsc] = useState(false);

  // Filtered & Paginated Transactions
  const filteredTransactions = useMemo(() => {
    if (!txSearch.trim()) return paymentTransactions;
    const q = txSearch.toLowerCase();
    return paymentTransactions.filter(
      (tx) =>
        tx.studentName.toLowerCase().includes(q) ||
        (tx.studentCode && tx.studentCode.toLowerCase().includes(q)) ||
        (tx.receiptNumber && tx.receiptNumber.toLowerCase().includes(q)) ||
        tx.groupName.toLowerCase().includes(q)
    );
  }, [paymentTransactions, txSearch]);

  const totalTxPages = Math.max(1, Math.ceil(filteredTransactions.length / TX_PER_PAGE));
  const currentTxRows = useMemo(() => {
    const start = (txPage - 1) * TX_PER_PAGE;
    return filteredTransactions.slice(start, start + TX_PER_PAGE);
  }, [filteredTransactions, txPage]);

  // Filtered & Paginated Outstanding Students
  const filteredOutstanding = useMemo(() => {
    if (!debtSearch.trim()) return outstandingStudents;
    const q = debtSearch.toLowerCase();
    return outstandingStudents.filter(
      (st) =>
        st.studentName.toLowerCase().includes(q) ||
        (st.studentCode && st.studentCode.toLowerCase().includes(q)) ||
        st.groupName.toLowerCase().includes(q) ||
        st.gradeName.toLowerCase().includes(q)
    );
  }, [outstandingStudents, debtSearch]);

  const totalDebtPages = Math.max(1, Math.ceil(filteredOutstanding.length / DEBT_PER_PAGE));
  const currentDebtRows = useMemo(() => {
    const start = (debtPage - 1) * DEBT_PER_PAGE;
    return filteredOutstanding.slice(start, start + DEBT_PER_PAGE);
  }, [filteredOutstanding, debtPage]);

  // Sorted Groups
  const sortedGroups = useMemo(() => {
    return [...groupRevenue].sort((a, b) => {
      const aVal = a[groupSortCol];
      const bVal = b[groupSortCol];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return groupSortAsc ? aVal - bVal : bVal - aVal;
      }
      return groupSortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [groupRevenue, groupSortCol, groupSortAsc]);

  const toggleGroupSort = (col: keyof GroupRevenueRow) => {
    if (groupSortCol === col) {
      setGroupSortAsc((v) => !v);
    } else {
      setGroupSortCol(col);
      setGroupSortAsc(false);
    }
  };

  // Monthly summary totals
  const monthlyTotals = useMemo(() => {
    return monthlySummary.reduce(
      (acc, m) => {
        acc.due += m.due;
        acc.collected += m.collected;
        acc.remaining += m.remaining;
        acc.expenses += m.expenses;
        acc.netProfit += m.netProfit;
        acc.paying += m.payingCount;
        acc.debt += m.debtCount;
        return acc;
      },
      { due: 0, collected: 0, remaining: 0, expenses: 0, netProfit: 0, paying: 0, debt: 0 }
    );
  }, [monthlySummary]);

  return (
    <div className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "0.85rem",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("monthly")}
          className={`btn ${activeTab === "monthly" ? "btn-primary" : "btn-secondary"}`}
          style={{
            fontSize: "0.82rem",
            padding: "0.45rem 0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            borderRadius: 8,
            whiteSpace: "nowrap",
          }}
        >
          <Calendar size={14} />
          <span>الملخص الشهري</span>
        </button>

        <button
          onClick={() => setActiveTab("stages")}
          className={`btn ${activeTab === "stages" ? "btn-primary" : "btn-secondary"}`}
          style={{
            fontSize: "0.82rem",
            padding: "0.45rem 0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            borderRadius: 8,
            whiteSpace: "nowrap",
          }}
        >
          <GraduationCap size={14} />
          <span>المراحل الدراسية ({stageRevenue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("groups")}
          className={`btn ${activeTab === "groups" ? "btn-primary" : "btn-secondary"}`}
          style={{
            fontSize: "0.82rem",
            padding: "0.45rem 0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            borderRadius: 8,
            whiteSpace: "nowrap",
          }}
        >
          <Users size={14} />
          <span>المجموعات ({groupRevenue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`btn ${activeTab === "transactions" ? "btn-primary" : "btn-secondary"}`}
          style={{
            fontSize: "0.82rem",
            padding: "0.45rem 0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            borderRadius: 8,
            whiteSpace: "nowrap",
          }}
        >
          <CreditCard size={14} />
          <span>سجل عمليات الدفع ({paymentTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("outstanding")}
          className={`btn ${activeTab === "outstanding" ? "btn-primary" : "btn-secondary"}`}
          style={{
            fontSize: "0.82rem",
            padding: "0.45rem 0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            borderRadius: 8,
            whiteSpace: "nowrap",
            color: activeTab === "outstanding" ? "#fff" : outstandingStudents.length > 0 ? "#f87171" : "inherit",
          }}
        >
          <AlertTriangle size={14} />
          <span>الطلاب المتأخرين ({outstandingStudents.length})</span>
        </button>
      </div>

      {/* ── Tab 1: Monthly Financial Summary ── */}
      {activeTab === "monthly" && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
              بيان تفصيلي لكل شهر في السنة الأكاديمية موضحاً الشهور المفعلة وغير المفعلة
            </p>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>الشهر</th>
                  <th>الحالة</th>
                  <th>المستحق</th>
                  <th>المحصل</th>
                  <th>المتبقي</th>
                  <th>نسبة التحصيل</th>
                  <th>المسددين</th>
                  <th>المتعثرين</th>
                  <th>المصروفات</th>
                  <th>صافي الربح</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummary.map((m) => (
                  <tr
                    key={`${m.month}-${m.year}`}
                    style={{
                      background: m.isCurrentMonth
                        ? "rgba(20, 184, 166, 0.06)"
                        : !m.isActive
                        ? "rgba(255, 255, 255, 0.015)"
                        : undefined,
                      opacity: m.isActive ? 1 : 0.6,
                    }}
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontWeight: m.isCurrentMonth ? 800 : 600 }}>
                          {m.name} {m.year}
                        </span>
                        {m.isCurrentMonth && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "rgba(20, 184, 166, 0.2)",
                              color: "var(--color-teal)",
                              fontWeight: 700,
                            }}
                          >
                            الحالي
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {m.isActive ? (
                        <span style={{ fontSize: "0.74rem", color: "var(--color-teal)" }}>● مفعّل</span>
                      ) : (
                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>غير مفعّل</span>
                      )}
                    </td>
                    <td className="monospace">{m.due.toLocaleString()} ج.م</td>
                    <td className="monospace" style={{ fontWeight: 700, color: "var(--color-teal)" }}>
                      {m.collected.toLocaleString()} ج.م
                    </td>
                    <td className="monospace" style={{ color: m.remaining > 0 ? "#f87171" : "var(--text-muted)" }}>
                      {m.remaining > 0 ? `${m.remaining.toLocaleString()} ج.م` : "—"}
                    </td>
                    <td>
                      {m.isActive ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span className="monospace" style={{ fontWeight: 600, fontSize: "0.8rem" }}>
                            {m.collectionRate}%
                          </span>
                          <div className="progress-bar-container" style={{ width: 45 }}>
                            <div className="progress-bar-fill" style={{ width: `${m.collectionRate}%` }} />
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{m.isActive ? `${m.payingCount} طالب` : "—"}</td>
                    <td style={{ color: m.debtCount > 0 ? "#f87171" : "inherit" }}>
                      {m.isActive && m.debtCount > 0 ? `${m.debtCount} طالب` : "—"}
                    </td>
                    <td className="monospace" style={{ color: m.expenses > 0 ? "#f87171" : "var(--text-muted)" }}>
                      {m.expenses > 0 ? `${m.expenses.toLocaleString()} ج.م` : "—"}
                    </td>
                    <td
                      className="monospace"
                      style={{
                        fontWeight: 700,
                        color: m.netProfit < 0 ? "#ef4444" : m.netProfit > 0 ? "#10b981" : "inherit",
                      }}
                    >
                      {m.netProfit.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 800, background: "rgba(15, 23, 42, 0.95)", borderTop: "2px solid var(--border-color)" }}>
                  <td>الإجمالي</td>
                  <td>—</td>
                  <td className="monospace">{monthlyTotals.due.toLocaleString()} ج.م</td>
                  <td className="monospace" style={{ color: "var(--color-teal)" }}>
                    {monthlyTotals.collected.toLocaleString()} ج.م
                  </td>
                  <td className="monospace" style={{ color: monthlyTotals.remaining > 0 ? "#f87171" : "inherit" }}>
                    {monthlyTotals.remaining.toLocaleString()} ج.م
                  </td>
                  <td>
                    {monthlyTotals.due > 0
                      ? `${Math.min(100, Math.round((monthlyTotals.collected / monthlyTotals.due) * 100))}%`
                      : "—"}
                  </td>
                  <td>{monthlyTotals.paying} طالب</td>
                  <td style={{ color: monthlyTotals.debt > 0 ? "#f87171" : "inherit" }}>
                    {monthlyTotals.debt} طالب
                  </td>
                  <td className="monospace" style={{ color: "#f87171" }}>
                    {monthlyTotals.expenses.toLocaleString()} ج.م
                  </td>
                  <td
                    className="monospace"
                    style={{
                      color: monthlyTotals.netProfit < 0 ? "#ef4444" : "#10b981",
                    }}
                  >
                    {monthlyTotals.netProfit.toLocaleString()} ج.م
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Revenue by Educational Stage ── */}
      {activeTab === "stages" && (
        <div style={{ marginTop: "1rem" }}>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            اضغط على أي مرحلة دراسية لعرض المجموعات والطلاب المتأخرين التابعين لها
          </p>
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>المرحلة الدراسية</th>
                  <th>إجمالي الطلاب</th>
                  <th>الطلاب المسددين</th>
                  <th>المبلغ المستحق</th>
                  <th>المبلغ المحصل</th>
                  <th>المتأخرات</th>
                  <th>نسبة التحصيل</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {stageRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      لا توجد بيانات لمراحل دراسية في هذا النطاق
                    </td>
                  </tr>
                ) : (
                  stageRevenue.map((sr) => (
                    <tr
                      key={sr.id}
                      onClick={() => onSelectStage(sr)}
                      style={{ cursor: "pointer", transition: "background 0.2s" }}
                      className="hover-row"
                    >
                      <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{sr.name}</td>
                      <td>{sr.totalStudents} طالب</td>
                      <td>
                        <span style={{ color: "var(--color-teal)", fontWeight: 600 }}>{sr.paidStudents}</span>
                      </td>
                      <td className="monospace">{sr.totalDue.toLocaleString()} ج.م</td>
                      <td className="monospace" style={{ fontWeight: 700, color: "var(--color-teal)" }}>
                        {sr.totalCollected.toLocaleString()} ج.م
                      </td>
                      <td className="monospace" style={{ color: sr.totalOutstanding > 0 ? "#f87171" : "var(--text-muted)" }}>
                        {sr.totalOutstanding > 0 ? `${sr.totalOutstanding.toLocaleString()} ج.م` : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span className="monospace" style={{ fontWeight: 600 }}>{sr.collectionRate}%</span>
                          <div className="progress-bar-container" style={{ width: 50 }}>
                            <div className="progress-bar-fill" style={{ width: `${sr.collectionRate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.55rem", fontSize: "0.75rem", borderRadius: 6 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStage(sr);
                          }}
                        >
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 3: Revenue by Group ── */}
      {activeTab === "groups" && (
        <div style={{ marginTop: "1rem" }}>
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th onClick={() => toggleGroupSort("name")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>اسم المجموعة</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th>المرحلة الدراسية</th>
                  <th onClick={() => toggleGroupSort("totalStudents")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>إجمالي الطلاب</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => toggleGroupSort("paidStudents")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>المسددين</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => toggleGroupSort("totalDue")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>المستحق</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => toggleGroupSort("totalCollected")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>المحصل</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => toggleGroupSort("remaining")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>المتبقي</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => toggleGroupSort("collectionRate")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>نسبة التحصيل</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedGroups.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      لا توجد مجموعات في النطاق المحدد
                    </td>
                  </tr>
                ) : (
                  sortedGroups.map((grp) => (
                    <tr key={grp.id}>
                      <td style={{ fontWeight: 700 }}>{grp.name}</td>
                      <td>{grp.gradeName}</td>
                      <td>{grp.totalStudents} طالب</td>
                      <td>
                        <span style={{ color: "var(--color-teal)", fontWeight: 600 }}>{grp.paidStudents}</span>
                      </td>
                      <td className="monospace">{grp.totalDue.toLocaleString()} ج.م</td>
                      <td className="monospace" style={{ fontWeight: 700, color: "var(--color-teal)" }}>
                        {grp.totalCollected.toLocaleString()} ج.م
                      </td>
                      <td className="monospace" style={{ color: grp.remaining > 0 ? "#f87171" : "var(--text-muted)" }}>
                        {grp.remaining > 0 ? `${grp.remaining.toLocaleString()} ج.م` : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span className="monospace" style={{ fontWeight: 600 }}>{grp.collectionRate}%</span>
                          <div className="progress-bar-container" style={{ width: 45 }}>
                            <div className="progress-bar-fill" style={{ width: `${grp.collectionRate}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 4: Payment Transactions ── */}
      {activeTab === "transactions" && (
        <div style={{ marginTop: "1rem" }}>
          {/* Search bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ position: "relative", minWidth: 240 }}>
              <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="بحث بالاسم أو الكود أو رقم المرجع…"
                value={txSearch}
                onChange={(e) => {
                  setTxSearch(e.target.value);
                  setTxPage(1);
                }}
                className="form-input"
                style={{ paddingRight: "2rem", fontSize: "0.82rem", borderRadius: 8 }}
              />
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              إجمالي {filteredTransactions.length} عملية دفع في هذه الفترة
            </div>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>المجموعة والمرحلة</th>
                  <th>شهر الاشتراك</th>
                  <th>تاريخ وساعة الدفع الفعلي</th>
                  <th>المبلغ المدفوع</th>
                  <th>طريقة الدفع</th>
                  <th>رقم المرجع / الإيصال</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {currentTxRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      لا توجد عمليات دفع مسجلة مطابقة للبحث في هذه الفترة
                    </td>
                  </tr>
                ) : (
                  currentTxRows.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600 }}>{tx.studentName}</span>
                          {tx.studentCode && (
                            <span className="monospace" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                              {tx.studentCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", fontSize: "0.78rem" }}>
                          <span>{tx.groupName}</span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{tx.gradeName}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>{tx.monthLabel}</span>
                      </td>
                      <td>
                        <span className="monospace" style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                          {tx.paidAt}
                        </span>
                      </td>
                      <td>
                        <span className="monospace" style={{ fontWeight: 700, color: "var(--color-teal)", fontSize: "0.92rem" }}>
                          {tx.amount.toLocaleString()} ج.م
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.74rem",
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {tx.method}
                        </span>
                      </td>
                      <td>
                        <span className="monospace" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {tx.receiptNumber || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "rgba(16, 185, 129, 0.12)",
                            color: "#10b981",
                            border: "1px solid rgba(16, 185, 129, 0.25)",
                          }}
                        >
                          مدفوع
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalTxPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.85rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                صفحة {txPage} من {totalTxPages}
              </span>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  className="btn btn-secondary"
                  disabled={txPage <= 1}
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={txPage >= totalTxPages}
                  onClick={() => setTxPage((p) => Math.min(totalTxPages, p + 1))}
                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 5: Outstanding Students ── */}
      {activeTab === "outstanding" && (
        <div style={{ marginTop: "1rem" }}>
          {/* Search bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ position: "relative", minWidth: 240 }}>
              <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="بحث باسم الطالب أو الكود أو المجموعة…"
                value={debtSearch}
                onChange={(e) => {
                  setDebtSearch(e.target.value);
                  setDebtPage(1);
                }}
                className="form-input"
                style={{ paddingRight: "2rem", fontSize: "0.82rem", borderRadius: 8 }}
              />
            </div>
            <div style={{ fontSize: "0.78rem", color: "#f87171" }}>
              إجمالي {filteredOutstanding.length} طالب لديهم التزامات غير مسددة
            </div>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>اسم الطالب والكود</th>
                  <th>المجموعة والمرحلة</th>
                  <th>شهور المتأخرات</th>
                  <th>المبلغ المستحق</th>
                  <th>المبلغ المتبقي</th>
                  <th>حالة التأخير</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentDebtRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "#10b981" }}>
                      <CheckCircle2 size={24} style={{ margin: "0 auto 0.5rem", display: "block" }} />
                      <span style={{ fontWeight: 600 }}>رائع! لا يوجد طلاب عليهم متأخرات مستحقة في هذا النطاق</span>
                    </td>
                  </tr>
                ) : (
                  currentDebtRows.map((st) => (
                    <tr key={st.studentId}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600 }}>{st.studentName}</span>
                          {st.studentCode && (
                            <span className="monospace" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                              {st.studentCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", fontSize: "0.78rem" }}>
                          <span>{st.groupName}</span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{st.gradeName}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                          {st.overdueMonths.map((m) => (
                            <span
                              key={`${m.month}-${m.year}`}
                              style={{
                                fontSize: "0.7rem",
                                padding: "1px 6px",
                                borderRadius: 4,
                                background: "rgba(239, 68, 68, 0.1)",
                                color: "#f87171",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                              }}
                            >
                              {m.label} ({m.netAmount} ج.م)
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="monospace">{st.originalAmount.toLocaleString()} ج.م</td>
                      <td className="monospace" style={{ fontWeight: 700, color: "#f87171", fontSize: "0.92rem" }}>
                        {st.remainingBalance.toLocaleString()} ج.م
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "#f87171",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            fontWeight: 600,
                          }}
                        >
                          {st.statusLabel}
                        </span>
                      </td>
                      <td>
                        <a
                          href={`/report/${st.studentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{
                            padding: "0.25rem 0.55rem",
                            fontSize: "0.75rem",
                            borderRadius: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            textDecoration: "none",
                          }}
                        >
                          <span>كشف الحساب</span>
                          <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalDebtPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.85rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                صفحة {debtPage} من {totalDebtPages}
              </span>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  className="btn btn-secondary"
                  disabled={debtPage <= 1}
                  onClick={() => setDebtPage((p) => Math.max(1, p - 1))}
                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={debtPage >= totalDebtPages}
                  onClick={() => setDebtPage((p) => Math.min(totalDebtPages, p + 1))}
                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
