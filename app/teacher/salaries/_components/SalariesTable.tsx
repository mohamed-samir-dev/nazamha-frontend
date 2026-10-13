"use client";

import { Pencil, Trash2, X, Check, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { Salary, TeacherExpense } from "@/lib/types";
import { ARABIC_MONTHS, EXPENSE_TYPES } from "../_hooks/useSalariesPage";

type CombinedItem = (Salary | TeacherExpense) & { _itemType: "salary" | "expense" };

interface Props {
  viewMode: "salaries" | "expenses";
  filtered: CombinedItem[];
  totalMonth: number;
  filterMonth: number;
  filterYear: number;
  availableYears: number[];
  deleteConfirm: string | null;
  actionLoading: boolean;
  setFilterMonth: (v: number) => void;
  setFilterYear: (v: number) => void;
  setDeleteConfirm: (v: string | null) => void;
  onEdit: (item: CombinedItem) => void;
  onDelete: (id: string) => void;
  onConfirmPayment: (id: string, month: number, year: number) => void;
}

function recurringRange(item: Salary | TeacherExpense) {
  if (!item.is_recurring) return null;
  const start = `${ARABIC_MONTHS[(item.start_month ?? item.month) - 1]} ${item.start_year ?? item.year}`;
  const end = item.end_month && item.end_year
    ? `${ARABIC_MONTHS[item.end_month - 1]} ${item.end_year}`
    : "مفتوح";
  return `${start} ← ${end}`;
}

function PaymentStatusBadge({ status }: { status?: string }) {
  const isPaid = status === "paid" || status == null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 20, fontSize: "0.75rem",
      background: isPaid ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
      color: isPaid ? "#10b981" : "#f59e0b",
      border: `1px solid ${isPaid ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
    }}>
      {isPaid ? <CheckCircle size={11} /> : <Clock size={11} />}
      {isPaid ? "مدفوع" : "معلق"}
    </span>
  );
}

export function SalariesTable({
  viewMode, filtered, totalMonth, filterMonth, filterYear, availableYears,
  deleteConfirm, actionLoading,
  setFilterMonth, setFilterYear, setDeleteConfirm, onEdit, onDelete, onConfirmPayment,
}: Props) {
  return (
    <>
      {/* Filters */}
      <div className="glass-panel" style={{ padding: "0.65rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>الشهر:</label>
          <select className="form-input" value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} style={{ padding: "0.3rem 0.6rem", borderRadius: 8, fontSize: "0.82rem", width: "auto" }}>
            {ARABIC_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>السنة:</label>
          <select className="form-input" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ padding: "0.3rem 0.6rem", borderRadius: 8, fontSize: "0.82rem", width: "auto" }}>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <span style={{ marginRight: "auto", fontSize: "0.78rem", color: "var(--text-muted)" }}>
          {filtered.length} سجل · {ARABIC_MONTHS[filterMonth - 1]} {filterYear}
        </span>
      </div>

      {/* Table */}
      <div className="glass-panel panel-content">
        <div className="table-container">
          <table className="report-table" style={{ fontSize: "0.85rem" }}>
            <thead>
              <tr>
                {viewMode === "salaries" ? (
                  <>
                    <th>اسم الموظف</th>
                    <th>الوظيفة</th>
                  </>
                ) : (
                  <>
                    <th>العنوان</th>
                    <th>النوع</th>
                  </>
                )}
                <th>التكرار / التاريخ</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>ملاحظات</th>
                <th style={{ width: 110 }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                    {viewMode === "salaries" ? "لا توجد رواتب مسجلة لهذا الشهر" : "لا توجد مصروفات مسجلة لهذا الشهر"}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const range = recurringRange(item);
                  const rowKey = item.is_virtual_instance ? `${item.id}` : item.is_recurring ? `${item.id}-${item.year}-${item.month}` : item.id;
                  const isPending = item.payment_status === "pending";

                  if (item._itemType === "salary") {
                    const s = item as Salary;
                    return (
                      <tr key={rowKey} style={{ opacity: isPending ? 1 : 0.85 }}>
                        <td style={{ fontWeight: 600 }}>{s.employee_name}</td>
                        <td>
                          <span style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(168,85,247,0.12)", color: "#a855f7", fontSize: "0.78rem", border: "1px solid rgba(168,85,247,0.2)" }}>
                            {s.role}
                          </span>
                        </td>
                        <td>
                          {s.is_virtual_instance ? (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              {ARABIC_MONTHS[s.month - 1]} {s.year}
                              <span style={{ marginRight: 6, fontSize: "0.7rem", color: "var(--color-teal)", background: "rgba(20,184,166,0.1)", padding: "1px 6px", borderRadius: 10, border: "1px solid rgba(20,184,166,0.2)" }}>متكرر</span>
                            </span>
                          ) : s.is_recurring ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "rgba(20,184,166,0.1)", color: "var(--color-teal)", fontSize: "0.75rem", border: "1px solid rgba(20,184,166,0.2)", width: "fit-content" }}>
                                <RefreshCw size={11} /> قالب متكرر
                              </span>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{range}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              {ARABIC_MONTHS[s.month - 1]} {s.year}
                            </span>
                          )}
                        </td>
                        <td className="monospace" style={{ fontWeight: 700, color: "#f87171" }}>{s.amount.toLocaleString()} ج.م</td>
                        <td><PaymentStatusBadge status={s.payment_status} /></td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{s.notes || "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                            {isPending && (
                              <button
                                onClick={() => onConfirmPayment(s.id, s.month, s.year)}
                                disabled={actionLoading}
                                title="تأكيد الدفع"
                                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", borderRadius: 7, padding: "4px 8px", cursor: "pointer" }}
                              >
                                <CheckCircle size={13} />
                              </button>
                            )}
                            {!s.is_recurring && (
                              <button onClick={() => onEdit(item)} style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "var(--color-teal)", borderRadius: 7, padding: "4px 8px", cursor: "pointer" }}>
                                <Pencil size={13} />
                              </button>
                            )}
                            {deleteConfirm === s.id ? (
                              <div style={{ display: "flex", gap: "0.25rem" }}>
                                <button onClick={() => onDelete(s.id)} disabled={actionLoading} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 7, padding: "4px 8px", cursor: "pointer" }}>
                                  <Check size={13} />
                                </button>
                                <button onClick={() => setDeleteConfirm(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-muted)", borderRadius: 7, padding: "4px 8px", cursor: "pointer" }}>
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(s.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 7, padding: "4px 8px", cursor: "pointer" }}>
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  } else {
                    const exp = item as TeacherExpense;
                    const typeInfo = EXPENSE_TYPES.find(t => t.value === exp.expense_type);
                    return (
                      <tr key={rowKey} style={{ opacity: isPending ? 1 : 0.85 }}>
                        <td style={{ fontWeight: 600 }}>{exp.title}</td>
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "3px 10px", borderRadius: 20,
                            background: `${typeInfo?.color}20`, color: typeInfo?.color,
                            fontSize: "0.78rem", border: `1px solid ${typeInfo?.color}40`
                          }}>
                            <span>{typeInfo?.icon}</span>
                            {typeInfo?.label}
                          </span>
                        </td>
                        <td>
                          {exp.is_virtual_instance ? (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              {ARABIC_MONTHS[exp.month - 1]} {exp.year}
                              <span style={{ marginRight: 6, fontSize: "0.7rem", color: "var(--color-teal)", background: "rgba(20,184,166,0.1)", padding: "1px 6px", borderRadius: 10, border: "1px solid rgba(20,184,166,0.2)" }}>متكرر</span>
                            </span>
                          ) : exp.is_recurring ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "rgba(20,184,166,0.1)", color: "var(--color-teal)", fontSize: "0.75rem", border: "1px solid rgba(20,184,166,0.2)", width: "fit-content" }}>
                                <RefreshCw size={11} /> قالب متكرر
                              </span>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{range}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              {ARABIC_MONTHS[exp.month - 1]} {exp.year}
                            </span>
                          )}
                        </td>
                        <td className="monospace" style={{ fontWeight: 700, color: "#ef4444" }}>{exp.amount.toLocaleString()} ج.م</td>
                        <td><PaymentStatusBadge status={exp.payment_status} /></td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {exp.notes || "—"}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                            {isPending && (
                              <button
                                onClick={() => onConfirmPayment(exp.id, exp.month, exp.year)}
                                disabled={actionLoading}
                                title="تأكيد الدفع"
                                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", borderRadius: 7, padding: "4px 8px", cursor: "pointer" }}
                              >
                                <CheckCircle size={13} />
                              </button>
                            )}
                            {!exp.is_recurring && (
                              <button onClick={() => onEdit(item)} style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "var(--color-teal)", borderRadius: 7, padding: "4px 8px", cursor: "pointer" }}>
                                <Pencil size={13} />
                              </button>
                            )}
                            {deleteConfirm === exp.id ? (
                              <div style={{ display: "flex", gap: "0.25rem" }}>
                                <button onClick={() => onDelete(exp.id)} disabled={actionLoading} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 7, padding: "4px 8px", cursor: "pointer" }}>
                                  <Check size={13} />
                                </button>
                                <button onClick={() => setDeleteConfirm(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-muted)", borderRadius: 7, padding: "4px 8px", cursor: "pointer" }}>
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(exp.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 7, padding: "4px 8px", cursor: "pointer" }}>
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                })
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: viewMode === "salaries" ? "rgba(168,85,247,0.05)" : "rgba(239,68,68,0.05)", borderTop: viewMode === "salaries" ? "2px solid rgba(168,85,247,0.2)" : "2px solid rgba(239,68,68,0.2)" }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                    {viewMode === "salaries" ? "إجمالي الشهر" : "إجمالي المصروفات"}
                  </td>
                  <td className="monospace" style={{ fontWeight: 900, color: viewMode === "salaries" ? "#f87171" : "#ef4444", fontSize: "1rem" }}>{totalMonth.toLocaleString()} ج.م</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </>
  );
}
