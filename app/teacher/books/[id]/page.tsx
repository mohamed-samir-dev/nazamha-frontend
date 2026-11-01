"use client";

import React, { useState, useEffect, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, BookOpen, TrendingUp, QrCode,
  CheckCircle, XCircle, Search, MessageCircle, Hash, Calendar, X,
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
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
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

  const notPurchasedStudents = students.filter((s: any) => !s.purchased);

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
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{
            width: 70, height: 85, borderRadius: "12px", flexShrink: 0,
            background: book.cover_image ? `url(${book.cover_image}) center/cover` : "rgba(20,184,166,0.12)",
            border: "1px solid rgba(20,184,166,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {!book.cover_image && <BookOpen size={28} style={{ color: "var(--color-teal)", opacity: 0.8 }} />}
          </div>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
              <span style={{
                fontSize: "0.68rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700,
                background: book.status === "available" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                color: book.status === "available" ? "#10b981" : "#f87171",
                border: `1px solid ${book.status === "available" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              }}>
                {book.status === "available" ? "● متاح للبيع" : "● غير متاح"}
              </span>
              {book.code && (
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "3px", fontFamily: "monospace" }}>
                  <Hash size={11} /> {book.code}
                </span>
              )}
              {book.academic_year && (
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Calendar size={11} /> {book.academic_year}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fff", margin: "0 0 0.35rem" }}>{book.name}</h1>
            {book.description && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 0.5rem", lineHeight: 1.5 }}>{book.description}</p>}
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-teal)" }}>{book.price} <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>جنيه</span></div>
          </div>
          <button
            onClick={() => router.push(`/teacher/books/scan?book_id=${id}`)}
            className="btn btn-primary"
            disabled={book.status === "unavailable"}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: book.status === "unavailable" ? 0.5 : 1 }}
          >
            <QrCode size={16} /> بيع بالـ QR
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginTop: "1.25rem" }}>
          {[
            { label: "عمليات البيع", value: buyers_count, color: "#10b981", icon: <CheckCircle size={16} /> },
            { label: "لم يشتروا", value: not_purchased_count, color: "#f87171", icon: <XCircle size={16} /> },
            { label: "إجمالي الإيرادات", value: `${total_revenue} ج`, color: "#f59e0b", icon: <TrendingUp size={16} /> },
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الكود..." style={{ width: "100%", padding: "0.55rem 2rem 0.55rem 0.7rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.82rem", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        {(["all", "purchased", "not_purchased"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "0.5rem 0.9rem", borderRadius: "8px", border: "1px solid", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", background: filter === f ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.03)", borderColor: filter === f ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.08)", color: filter === f ? "var(--color-teal)" : "var(--text-muted)" }}>
            {f === "all" ? "الكل" : f === "purchased" ? "✔ اشترى" : "✖ لم يشتر"}
          </button>
        ))}
        {not_purchased_count > 0 && (
          <button
            onClick={() => setShowWhatsAppModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0.5rem 0.9rem", borderRadius: "8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}
          >
            <MessageCircle size={14} /> تذكير واتساب ({not_purchased_count})
          </button>
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
                const extraSales = s.extra_sales ?? [];
                return (
                  <React.Fragment key={s.student_id}>
                    <tr style={{ borderBottom: extraSales.length > 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
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
                          ? s.is_exempt
                            ? <span style={{ color: "#818cf8" }}>معفي</span>
                            : s.paid
                            ? <span style={{ color: "#10b981" }}>مدفوع</span>
                            : <span style={{ color: "#f59e0b" }}>غير مدفوع</span>
                          : <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)" }}>
                        {s.purchase_date ? new Date(s.purchase_date).toLocaleDateString("ar-EG") : "—"}
                      </td>
                      <td style={{ padding: "0.7rem 1rem", color: s.final_price != null ? "var(--color-teal)" : "var(--text-muted)", fontWeight: s.final_price != null ? 600 : 400 }}>
                        {s.final_price != null ? `${s.final_price} ج` : "—"}
                      </td>
                      <td style={{ padding: "0.7rem 1rem", color: s.discount ? "#f59e0b" : "var(--text-muted)" }}>
                        {s.is_exempt ? <span style={{ color: "#818cf8" }}>إعفاء 100%</span> : s.discount ? `${s.discount} ج` : "—"}
                      </td>
                      <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)" }}>{s.receipt_number || "—"}</td>
                    </tr>

                    {/* Extra Sales Rows */}
                    {extraSales.map((es: any, ei: number) => (
                      <tr key={es.sale_id} style={{ borderBottom: ei === extraSales.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: "rgba(245,158,11,0.03)" }}>
                        <td style={{ padding: "0.5rem 1rem 0.5rem 2rem" }} colSpan={2}>
                          <span style={{ fontSize: "0.72rem", color: "#f59e0b" }}>↳ شراء مكرر #{ei + 2}</span>
                        </td>
                        <td style={{ padding: "0.5rem 1rem", color: "var(--text-muted)" }}>—</td>
                        <td style={{ padding: "0.5rem 1rem", color: "#10b981" }}>نعم</td>
                        <td style={{ padding: "0.5rem 1rem" }}>
                          <span style={{ color: es.paid ? "#10b981" : "#f59e0b" }}>{es.paid ? "مدفوع" : "غير مدفوع"}</span>
                        </td>
                        <td style={{ padding: "0.5rem 1rem", color: "var(--text-muted)" }}>
                          {es.purchase_date ? new Date(es.purchase_date).toLocaleDateString("ar-EG") : "—"}
                        </td>
                        <td style={{ padding: "0.5rem 1rem", color: "var(--color-teal)", fontWeight: 600 }}>
                          {es.final_price != null ? `${es.final_price} ج` : "—"}
                        </td>
                        <td style={{ padding: "0.5rem 1rem", color: "var(--text-muted)" }}>
                          {es.is_exempt ? "إعفاء" : es.discount ? `${es.discount} ج` : "—"}
                        </td>
                        <td style={{ padding: "0.5rem 1rem", color: "var(--text-muted)" }}>—</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>لا توجد نتائج مطابقة</div>
          )}
        </div>
      </div>

      {/* WhatsApp Modal for Non-Buyers */}
      {showWhatsAppModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setShowWhatsAppModal(false)}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "520px", maxHeight: "85vh", display: "flex", flexDirection: "column", padding: "1.25rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MessageCircle size={18} style={{ color: "#25d366" }} />
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#fff", fontWeight: 700 }}>الطلاب الذين لم يشتروا الكتاب ({notPurchasedStudents.length})</h3>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, paddingRight: "0.25rem" }}>
              {notPurchasedStudents.map((st: any) => {
                const phone = st.parent_phone || st.phone;
                const message = `السلام عليكم ورحمة الله، نود تذكيركم بأن كتاب "${book.name}" بسعر ${book.price} جنيه متاح حالياً للطالب/ة ${st.name}.`;
                const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : null;
                const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith("0") ? "2" + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}` : null;

                return (
                  <div key={st.student_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>{st.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>كود: {st.code || "—"} {phone ? `· هاتف: ${phone}` : "· لا يوجد هاتف"}</div>
                    </div>
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0.35rem 0.65rem", borderRadius: "6px", background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}
                      >
                        <MessageCircle size={13} /> إرسال واتساب
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>غير متوفر</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
