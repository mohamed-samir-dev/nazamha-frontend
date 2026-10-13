"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Users, TrendingUp, QrCode,
  CheckCircle, XCircle, Search, MessageCircle,
} from "lucide-react";
import { BooksService } from "@/lib/services/booksService";
import { GroupsService } from "@/lib/services/groupsService";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { Group } from "@/lib/types";

export default function BookDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "purchased" | "not_purchased">("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    Promise.all([BooksService.getBookDetails(id), GroupsService.getGroupsByTeacherId()])
      .then(([d, g]) => { setData(d); setGroups(g); })
      .catch(() => setToast({ message: "فشل تحميل البيانات", type: "error" }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner fullScreen />;
  if (!data) return null;

  const { book, buyers_count, total_revenue, not_purchased_count, students } = data;

  const filtered = students.filter((s: any) => {
    if (filter === "purchased" && !s.purchased) return false;
    if (filter === "not_purchased" && s.purchased) return false;
    if (search && !s.name.includes(search) && !s.code?.includes(search)) return false;
    return true;
  });

  const notPurchasedPhones = students
    .filter((s: any) => !s.purchased)
    .map((s: any) => s.parent_phone)
    .filter(Boolean);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <Link href="/teacher/books" style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", textDecoration: "none" }}>
          <ArrowRight size={14} /> الكتب
        </Link>
        <span>/</span>
        <span style={{ color: "#fff" }}>{book.name}</span>
      </div>

      {/* Book Header */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{
            width: 64, height: 80, borderRadius: "10px", flexShrink: 0,
            background: book.cover_image ? `url(${book.cover_image}) center/cover` : "rgba(20,184,166,0.1)",
            border: "1px solid rgba(20,184,166,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {!book.cover_image && <BookOpen size={24} style={{ color: "var(--color-teal)", opacity: 0.6 }} />}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: "0 0 0.25rem" }}>{book.name}</h1>
            {book.description && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>{book.description}</p>}
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-teal)" }}>{book.price} جنيه</div>
          </div>
          <button
            onClick={() => router.push(`/teacher/books/scan?book_id=${id}`)}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <QrCode size={16} /> بيع بالـ QR
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginTop: "1.25rem" }}>
          {[
            { label: "المشترين", value: buyers_count, color: "#10b981", icon: <CheckCircle size={16} /> },
            { label: "لم يشتروا", value: not_purchased_count, color: "#f87171", icon: <XCircle size={16} /> },
            { label: "الإيرادات", value: `${total_revenue} ج`, color: "#f59e0b", icon: <TrendingUp size={16} /> },
          ].map((s) => (
            <div key={s.label} style={{ padding: "0.75rem", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: s.color }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + WhatsApp */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
          <Search size={13} style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." style={{ width: "100%", padding: "0.55rem 2rem 0.55rem 0.7rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.82rem", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        {(["all", "purchased", "not_purchased"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "0.5rem 0.9rem", borderRadius: "8px", border: "1px solid", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", background: filter === f ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.03)", borderColor: filter === f ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.08)", color: filter === f ? "var(--color-teal)" : "var(--text-muted)" }}>
            {f === "all" ? "الكل" : f === "purchased" ? "✔ اشترى" : "✖ لم يشتر"}
          </button>
        ))}
        {notPurchasedPhones.length > 0 && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`تذكير: كتاب "${book.name}" بسعر ${book.price} جنيه متاح الآن`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0.5rem 0.9rem", borderRadius: "8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366", fontSize: "0.8rem", textDecoration: "none" }}
          >
            <MessageCircle size={14} /> واتساب ({not_purchased_count})
          </a>
        )}
      </div>

      {/* Students Table */}
      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["الطالب", "الكود", "المجموعة", "اشترى؟", "دفع؟", "تاريخ الشراء", "المبلغ", "الخصم", "رقم الفاتورة"].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => {
                const group = groups.find((g) => g.id === s.group_id);
                return (
                  <tr key={s.student_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.7rem 1rem", color: "#fff", fontWeight: 500 }}>
                      <Link href={`/teacher/students/${s.student_id}`} style={{ color: "#fff", textDecoration: "none" }}>{s.name}</Link>
                    </td>
                    <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)" }}>{s.code || "—"}</td>
                    <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)" }}>{group?.name || "—"}</td>
                    <td style={{ padding: "0.7rem 1rem" }}>
                      {s.purchased
                        ? <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={14} /> نعم</span>
                        : <span style={{ color: "#f87171", display: "flex", alignItems: "center", gap: "4px" }}><XCircle size={14} /> لا</span>}
                    </td>
                    <td style={{ padding: "0.7rem 1rem" }}>
                      {s.purchased
                        ? s.paid
                          ? <span style={{ color: "#10b981" }}>مدفوع</span>
                          : <span style={{ color: "#f59e0b" }}>غير مدفوع</span>
                        : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)" }}>
                      {s.purchase_date ? new Date(s.purchase_date).toLocaleDateString("ar-EG") : "—"}
                    </td>
                    <td style={{ padding: "0.7rem 1rem", color: s.amount != null ? "var(--color-teal)" : "var(--text-muted)", fontWeight: s.amount != null ? 600 : 400 }}>
                      {s.amount != null ? `${s.amount} ج` : "—"}
                    </td>
                    <td style={{ padding: "0.7rem 1rem", color: s.discount ? "#f59e0b" : "var(--text-muted)" }}>
                      {s.is_exempt ? <span style={{ color: "#818cf8" }}>إعفاء</span> : s.discount ? `${s.discount} ج` : "—"}
                    </td>
                    <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)" }}>{s.receipt_number || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>لا توجد نتائج</div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
