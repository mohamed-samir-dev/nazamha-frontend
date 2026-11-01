"use client";

import { useState, useEffect } from "react";
import { Search, XCircle, ShoppingBag } from "lucide-react";
import { BooksService } from "@/lib/services/booksService";
import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/errors";

const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function BooksSalesTab() {
  const now = new Date();
  const currentYearNum = now.getFullYear();
  const availableYears = [currentYearNum - 2, currentYearNum - 1, currentYearNum, currentYearNum + 1];

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(currentYearNum));
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setSales(await BooksService.getSales({ month, year }));
    } catch {
      setToast({ message: "فشل تحميل المبيعات", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]);

  const handleCancel = async (saleId: string) => {
    if (!window.confirm("هل أنت متأكد من إلغاء عملية البيع هذه بالكامل؟")) return;
    try {
      await BooksService.cancelSale(saleId);
      setToast({ message: "تم إلغاء البيع بنجاح", type: "success" });
      load();
    } catch (e: unknown) {
      setToast({ message: getErrorMessage(e, "حدث خطأ أثناء إلغاء البيع."), type: "error" });
    }
  };

  const filtered = sales.filter((s) => {
    if (!search) return true;
    const student = s.student_id as any;
    const book = s.book_id as any;
    return student?.name?.includes(search) || book?.name?.includes(search) || student?.code?.includes(search);
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + (s.final_price ?? 0), 0);

  const selectStyle: React.CSSProperties = {
    padding: "0.55rem 0.75rem", borderRadius: "8px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff", fontSize: "0.82rem", fontFamily: "inherit",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div className="glass-panel" style={{ padding: "0.75rem 1.25rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <ShoppingBag size={18} style={{ color: "#818cf8" }} />
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>عدد العمليات:</span>
          <span style={{ fontWeight: 700, color: "#818cf8" }}>{filtered.length}</span>
        </div>
        <div className="glass-panel" style={{ padding: "0.75rem 1.25rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>إجمالي الإيرادات:</span>
          <span style={{ fontWeight: 700, color: "#f59e0b" }}>{totalRevenue} ج</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
          <Search size={13} style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث باسم الطالب، الكود، أو اسم الكتاب..." style={{ width: "100%", padding: "0.55rem 2rem 0.55rem 0.7rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.82rem", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={selectStyle}>
          {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)} style={{ background: "#1e293b" }}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
          {availableYears.map((y) => <option key={y} value={String(y)} style={{ background: "#1e293b" }}>{y}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["الطالب", "الكود", "الكتاب", "السعر", "الخصم", "المدفوع", "التاريخ", "إلغاء البيع"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const student = s.student_id as any;
                  const book = s.book_id as any;
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "0.7rem 1rem", color: "#fff" }}>{student?.name || "—"}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)" }}>{student?.code || "—"}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "var(--text-secondary)" }}>{book?.name || "—"}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)" }}>{s.price} ج</td>
                      <td style={{ padding: "0.7rem 1rem", color: s.is_exempt ? "#818cf8" : s.discount > 0 ? "#f59e0b" : "var(--text-muted)" }}>
                        {s.is_exempt ? "إعفاء" : s.discount > 0 ? `${s.discount} ج` : "—"}
                      </td>
                      <td style={{ padding: "0.7rem 1rem", color: "var(--color-teal)", fontWeight: 600 }}>{s.final_price} ج</td>
                      <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)" }}>{new Date(s.created_at).toLocaleDateString("ar-EG")}</td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        <button onClick={() => handleCancel(s.id)} style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", fontFamily: "inherit", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "3px" }}>
                          <XCircle size={12} /> إلغاء
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>لا توجد مبيعات في هذا الشهر</div>
            )}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
