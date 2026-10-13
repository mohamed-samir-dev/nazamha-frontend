"use client";

import { BookMarked, Users, TrendingUp } from "lucide-react";
import { Book } from "@/lib/types";

interface Props {
  books: Book[];
}

export default function BooksStats({ books }: Props) {
  const totalRevenue = books.reduce((s, b) => s + (b.total_revenue ?? 0), 0);
  const totalBuyers = books.reduce((s, b) => s + (b.buyers_count ?? 0), 0);

  const stats = [
    { label: "إجمالي الكتب", value: books.length, icon: <BookMarked size={18} />, color: "#14b8a6" },
    { label: "إجمالي المبيعات", value: totalBuyers, icon: <Users size={18} />, color: "#818cf8" },
    { label: "إجمالي الإيرادات", value: `${totalRevenue} ج`, icon: <TrendingUp size={18} />, color: "#f59e0b" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
      {stats.map((s) => (
        <div key={s.label} className="glass-panel" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ color: s.color, flexShrink: 0 }}>{s.icon}</div>
          <div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
