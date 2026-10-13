"use client";

import { useState, useEffect } from "react";
import { BarChart3, BookOpen, Users, TrendingUp, Award, Tag, Gift, XCircle } from "lucide-react";
import { BooksService } from "@/lib/services/booksService";
import { Spinner } from "@/components/ui/Spinner";

export default function BooksReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    BooksService.getReport().then(setReport).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullScreen />;
  if (!report) return null;

  const stats = [
    { label: "إجمالي الكتب", value: report.total_books, icon: <BookOpen size={20} />, color: "#14b8a6" },
    { label: "إجمالي المبيعات", value: report.total_sales, icon: <Users size={20} />, color: "#818cf8" },
    { label: "إجمالي الإيرادات", value: `${report.total_revenue} ج`, icon: <TrendingUp size={20} />, color: "#f59e0b" },
    { label: "إجمالي الخصومات", value: `${report.total_discount} ج`, icon: <Tag size={20} />, color: "#f87171" },
    { label: "إجمالي الإعفاءات", value: report.total_exempt, icon: <Gift size={20} />, color: "#a78bfa" },
    { label: "لم يشتروا أي كتاب", value: report.not_bought_count, icon: <XCircle size={20} />, color: "#6b7280" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <BarChart3 size={22} style={{ color: "var(--color-teal)" }} />
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: 0 }}>تقارير الكتب</h1>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {stats.map((s) => (
          <div key={s.label} className="glass-panel" style={{ padding: "1.1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Best Book */}
      {report.best_book && (
        <div className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Award size={28} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>أفضل كتاب مبيعاً</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{report.best_book.name}</div>
            <div style={{ fontSize: "0.82rem", color: "#f59e0b" }}>{report.best_book.sales} مبيعة</div>
          </div>
        </div>
      )}

      {/* Per Book Table */}
      {report.per_book.length > 0 && (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>إحصائيات كل كتاب</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["الكتاب", "السعر", "المبيعات", "الإيرادات", "الخصومات", "الإعفاءات"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", color: "var(--text-muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.per_book.map((b: any) => (
                  <tr key={b.book_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.7rem 1rem", color: "#fff", fontWeight: 500 }}>{b.name}</td>
                    <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)" }}>{b.price} ج</td>
                    <td style={{ padding: "0.7rem 1rem", color: "#818cf8", fontWeight: 600 }}>{b.sales_count}</td>
                    <td style={{ padding: "0.7rem 1rem", color: "#f59e0b", fontWeight: 600 }}>{b.revenue} ج</td>
                    <td style={{ padding: "0.7rem 1rem", color: "#f87171" }}>{b.discount} ج</td>
                    <td style={{ padding: "0.7rem 1rem", color: "#a78bfa" }}>{b.exempt_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
