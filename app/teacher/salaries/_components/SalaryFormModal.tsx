"use client";

import { Users, X, Receipt } from "lucide-react";
import { ARABIC_MONTHS, CURRENT_YEAR, SalaryForm, EXPENSE_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES } from "../_hooks/useSalariesPage";

interface Props {
  viewMode: "salaries" | "expenses";
  editingId: string | null;
  form: SalaryForm;
  formError: string;
  actionLoading: boolean;
  setForm: React.Dispatch<React.SetStateAction<SalaryForm>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 2 + i);
const L: React.CSSProperties = { fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.35rem", display: "block", fontWeight: 600 };

export function SalaryFormModal({ viewMode, editingId, form, formError, actionLoading, setForm, onSubmit, onClose }: Props) {
  const set = <K extends keyof SalaryForm>(k: K, v: SalaryForm[K]) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: 550, padding: "1.5rem", borderRadius: 16, border: viewMode === "salaries" ? "1px solid rgba(168,85,247,0.25)" : "1px solid rgba(239,68,68,0.25)", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {viewMode === "salaries" ? (
              <>
                <Users size={18} style={{ color: "#a855f7" }} />
                {editingId ? "تعديل الراتب" : "إضافة راتب"}
              </>
            ) : (
              <>
                <Receipt size={18} style={{ color: "#ef4444" }} />
                {editingId ? "تعديل المصروف" : "إضافة مصروف"}
              </>
            )}
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>

          {viewMode === "salaries" ? (
            <>
              {/* Salary Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={L}>اسم الموظف *</label>
                  <input className="form-input" value={form.employee_name} onChange={e => set("employee_name", e.target.value)} placeholder="مثال: أحمد محمد" style={{ width: "100%" }} required />
                </div>
                <div>
                  <label style={L}>الوظيفة *</label>
                  <input className="form-input" value={form.role} onChange={e => set("role", e.target.value)} placeholder="مثال: سكرتير" style={{ width: "100%" }} required />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Expense Fields - Simplified */}
              <div>
                <label style={L}>العنوان *</label>
                <input className="form-input" value={form.title || ""} onChange={e => set("title", e.target.value)} placeholder="مثال: إيجار المركز، فاتورة كهرباء" style={{ width: "100%" }} required />
              </div>

              <div>
                <label style={L}>نوع المصروف *</label>
                <select className="form-input" value={form.expense_type} onChange={e => set("expense_type", e.target.value as any)} style={{ width: "100%" }} required>
                  {EXPENSE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={L}>تاريخ الدفع (اختياري)</label>
                <input type="date" className="form-input" value={form.paid_date || ""} onChange={e => set("paid_date", e.target.value)} style={{ width: "100%" }} />
              </div>
            </>
          )}

          {/* Amount */}
          <div>
            <label style={L}>المبلغ (ج.م) *</label>
            <input type="number" step="0.01" className="form-input" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" style={{ width: "100%" }} required />
          </div>

          {/* Recurring */}
          <div style={{ padding: "0.75rem", background: viewMode === "salaries" ? "rgba(168,85,247,0.08)" : "rgba(239,68,68,0.08)", border: viewMode === "salaries" ? "1px solid rgba(168,85,247,0.2)" : "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_recurring} onChange={e => set("is_recurring", e.target.checked)} style={{ width: 16, height: 16 }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{viewMode === "salaries" ? "راتب متكرر شهرياً" : "مصروف متكرر شهرياً"}</span>
            </label>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem", marginRight: "1.5rem" }}>
              سيتم إضافته تلقائياً كل شهر ضمن النطاق المحدد
            </p>
          </div>

          {/* Date/Range */}
          {form.is_recurring ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={L}>شهر البداية *</label>
                  <select className="form-input" value={form.start_month} onChange={e => set("start_month", Number(e.target.value))} style={{ width: "100%" }} required>
                    {ARABIC_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={L}>سنة البداية *</label>
                  <select className="form-input" value={form.start_year} onChange={e => set("start_year", Number(e.target.value))} style={{ width: "100%" }} required>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={L}>شهر النهاية (اختياري)</label>
                  <select className="form-input" value={form.end_month} onChange={e => set("end_month", e.target.value ? Number(e.target.value) : "")} style={{ width: "100%" }}>
                    <option value="">مفتوح</option>
                    {ARABIC_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={L}>سنة النهاية (اختياري)</label>
                  <select className="form-input" value={form.end_year} onChange={e => set("end_year", e.target.value ? Number(e.target.value) : "")} style={{ width: "100%" }}>
                    <option value="">مفتوح</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={L}>الشهر *</label>
                <select className="form-input" value={form.month} onChange={e => set("month", Number(e.target.value))} style={{ width: "100%" }} required>
                  {ARABIC_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={L}>السنة *</label>
                <select className="form-input" value={form.year} onChange={e => set("year", Number(e.target.value))} style={{ width: "100%" }} required>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={L}>ملاحظات (اختياري)</label>
            <textarea className="form-input" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="أي ملاحظات إضافية..." rows={2} style={{ width: "100%", resize: "vertical" }} />
          </div>

          {/* Error */}
          {formError && (
            <div style={{ padding: "0.65rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#f87171", fontSize: "0.85rem" }}>
              {formError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} className="btn" style={{ background: "var(--card-bg)", color: "var(--text-secondary)", border: "1px solid var(--border)", padding: "0.5rem 1rem" }}>
              إلغاء
            </button>
            <button type="submit" disabled={actionLoading} className="btn" style={{ background: viewMode === "salaries" ? "rgba(168,85,247,0.15)" : "rgba(239,68,68,0.15)", color: viewMode === "salaries" ? "#a855f7" : "#ef4444", border: viewMode === "salaries" ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(239,68,68,0.3)", padding: "0.5rem 1rem", opacity: actionLoading ? 0.6 : 1 }}>
              {actionLoading ? "جاري الحفظ..." : editingId ? "حفظ التغييرات" : viewMode === "salaries" ? "إضافة الراتب" : "إضافة المصروف"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
