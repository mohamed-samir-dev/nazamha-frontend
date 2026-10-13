"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Search, XCircle } from "lucide-react";
import { BooksService } from "@/lib/services/booksService";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/errors";

export default function BookSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const load = async () => {
    setLoading(true);
    try {
      const data = await BooksService.getSales({ month, year });
      setSales(data);
    } catch {
      setToast({ message: "فشل تحميل المبيعات", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]);

  const handleCancel = async (saleId: string) => {
    if (!confirm("هل تريد إلغاء هذه العملية؟")) return;
    try {
      await BooksService.cancelSale(saleId);
      setToast({ message: "تم إلغاء البيع", type: "success" });
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

  const totalRevenue = filtered.reduce((sum, s) => sum + s.final_price, 0);

  const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  if (loading) return <Spinner fullScreen />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <ShoppingBag size={22} style={{ color: "var(--color-teal)" }} />
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: 0 }}>مبيعات الكتب</h1>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>{filtered.length} عملية · إجمالي {totalRevenue} جنيه</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
          <Search size={13} style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." style={{ width: "100%", padding: "0.55rem 2rem 0.55rem 0.7rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.82rem", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: "0.55rem 0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.82rem", fontFamily: "inherit" }}>
          {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: "0.55rem 0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.82rem", fontFamily: "inherit" }}>
          {[2024, 2025, 2026].map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["الطالب", "الكتاب", "السعر", "الخصم", "المدفوع", "التاريخ", "إلغاء"].map((h) => (
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
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>لا توجد مبيعات</div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
