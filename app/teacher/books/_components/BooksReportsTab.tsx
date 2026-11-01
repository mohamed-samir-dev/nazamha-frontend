"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Award, Search, Gift, Check, Trash2, XCircle } from "lucide-react";
import { FINANCIAL_CHANGED } from "@/lib/financialEvents";
import { BooksService } from "@/lib/services/booksService";
import { GroupsService } from "@/lib/services/groupsService";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { Book, Grade } from "@/lib/types";

interface Props { books: Book[]; grades: Grade[]; onAction?: () => void; }

export default function BooksReportsTab({ books, grades, onAction }: Props) {
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [details, setDetails]               = useState<any>(null);
  const [groups, setGroups]                 = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [search, setSearch]                 = useState("");
  const [filter, setFilter]                 = useState<"all" | "purchased" | "not_purchased">("all");
  const [loadingAction, setLoadingAction]   = useState<string | null>(null);
  const [toast, setToast]                   = useState<{ message: string; type: "success" | "error" } | null>(null);
  const detailsRequest = useRef(0);

  // الصفوف الموجودة فعلاً في الكتب
  const activeGradeIds = [...new Set(books.map(b => b.grade_id).filter(Boolean))] as string[];
  const activeGrades = grades.filter(g => activeGradeIds.includes(g.id));
  const hasGeneralBooks = books.some(b => !b.grade_id);

  const filteredBooks = selectedGradeId === "general"
    ? books.filter(b => !b.grade_id)
    : selectedGradeId
    ? books.filter(b => b.grade_id === selectedGradeId)
    : books;

  const topBooks = [...filteredBooks].sort((a, b) => (b.buyers_count ?? 0) - (a.buyers_count ?? 0)).slice(0, 3);

  useEffect(() => {
    GroupsService.getGroupsByTeacherId().then(setGroups).catch(() => {});
  }, []);

  const loadDetails = (bookId: string, silent = false) => {
    if (!bookId) { setDetails(null); return; }
    if (!silent) setLoadingDetails(true);
    const request = ++detailsRequest.current;
    BooksService.getBookDetails(bookId)
      .then(data => { if (request === detailsRequest.current) setDetails(data); })
      .catch(() => { if (request === detailsRequest.current && !silent) setDetails(null); })
      .finally(() => { if (request === detailsRequest.current) setLoadingDetails(false); });
  };

  useEffect(() => {
    setSearch(""); setFilter("all");
    loadDetails(selectedBookId);
    let timer: ReturnType<typeof setTimeout>;
    const update = () => { clearTimeout(timer); timer = setTimeout(() => loadDetails(selectedBookId, true), 300); };
    window.addEventListener(FINANCIAL_CHANGED, update);
    return () => { detailsRequest.current++; clearTimeout(timer); window.removeEventListener(FINANCIAL_CHANGED, update); };
  }, [selectedBookId]);

  const withAction = async (key: string, fn: () => Promise<any>, successMsg = "تم بنجاح") => {
    setLoadingAction(key);
    try {
      await fn();
      loadDetails(selectedBookId, true);
      onAction?.();
      setToast({ message: successMsg, type: "success" });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "حدث خطأ";
      setToast({ message: msg, type: "error" });
    } finally {
      setLoadingAction(null);
    }
  };

  const selectedBook = details?.book;

  const handleManualSell = (studentId: string) => {
    if (selectedBook?.status === "unavailable") return;
    return withAction(studentId + "_sell", () => BooksService.sellBook({ book_id: selectedBookId, student_id: studentId, force_resell: false }), "تم تسجيل البيع");
  };

  const handleMarkPaid = (saleId: string) =>
    withAction(saleId + "_paid", () => BooksService.markSalePaid(saleId), "تم تسجيل الدفع");

  const handleMarkUnpaid = (saleId: string) =>
    withAction(saleId + "_unpaid", () => BooksService.markSaleUnpaid(saleId), "تم إلغاء حالة الدفع");

  const handleCancelSale = (saleId: string) => {
    if (!window.confirm("هل أنت متأكد من إلغاء عملية الشراء لهذا الطالب بالكامل؟")) return;
    return withAction(saleId + "_cancel", () => BooksService.cancelSale(saleId), "تم إلغاء البيع");
  };

  const handleExempt = (studentId: string) => {
    if (selectedBook?.status === "unavailable") return;
    return withAction(studentId + "_exempt", () => BooksService.sellExempt({ book_id: selectedBookId, student_id: studentId }), "تم تسجيل الإعفاء");
  };

  const handleCancelExempt = (saleId: string) => {
    if (!window.confirm("هل تريد إلغاء الإعفاء؟ سيتم حذف الإعفاء لهذا الطالب.")) return;
    return withAction(saleId + "_cancel", () => BooksService.cancelSale(saleId), "تم إلغاء الإعفاء");
  };

  const filtered = details?.students?.filter((s: any) => {
    if (filter === "purchased"     && !s.purchased) return false;
    if (filter === "not_purchased" &&  s.purchased) return false;
    if (search && !s.name.includes(search) && !s.code?.includes(search)) return false;
    return true;
  }) ?? [];

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => { setPage(1); }, [search, filter, selectedBookId]);

  const totalRevenue = filtered
    .filter((s: any) => s.purchased && !s.is_exempt && (s.final_price ?? 0) > 0)
    .reduce((sum: number, s: any) => {
      const primary = !s.is_exempt ? Number(s.final_price ?? 0) : 0;
      const extra = (s.extra_sales ?? []).reduce((es: number, e: any) => es + (!e.is_exempt ? Number(e.final_price ?? 0) : 0), 0);
      return sum + primary + extra;
    }, 0);
  const purchasedCount = filtered.filter((s: any) => s.purchased).length;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Top Books */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
        {topBooks.map((b, i) => {
          const grade = grades.find(g => g.id === b.grade_id);
          return (
            <div key={b.id} className="glass-panel" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Award size={22} style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#b45309", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem", display: "flex", gap: "0.5rem" }}>
                  {grade && <span style={{ color: "#818cf8" }}>{grade.name}</span>}
                  <span>{b.buyers_count ?? 0} مبيعة</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Book selector */}
      <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
        <select
          value={selectedGradeId}
          onChange={(e) => { setSelectedGradeId(e.target.value); setSelectedBookId(""); setDetails(null); }}
          style={{ padding: "0.6rem 0.9rem", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: `1px solid ${selectedGradeId ? "rgba(255,255,255,0.1)" : "rgba(245,158,11,0.5)"}`, color: selectedGradeId ? "#fff" : "var(--text-muted)", fontSize: "0.88rem", fontFamily: "inherit", cursor: "pointer", width: "100%" }}
        >
          <option value="">اختر الصف الدراسي أولاً للتصفية *</option>
          {activeGrades.map(g => <option key={g.id} value={g.id} style={{ background: "#1e293b" }}>{g.name}</option>)}
          {hasGeneralBooks && <option value="general" style={{ background: "#1e293b" }}>كتب عامة (بدون صف)</option>}
        </select>
        <select
          value={selectedBookId}
          onChange={(e) => setSelectedBookId(e.target.value)}
          disabled={!selectedGradeId}
          style={{ flex: 1, padding: "0.6rem 0.9rem", borderRadius: "10px", background: selectedGradeId ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", color: selectedBookId ? "#fff" : "var(--text-muted)", fontSize: "0.88rem", fontFamily: "inherit", cursor: selectedGradeId ? "pointer" : "not-allowed", opacity: selectedGradeId ? 1 : 0.5 }}
        >
          <option value="">{selectedGradeId ? "اختر كتاباً لعرض تفاصيله..." : "اختر الصف أولاً"}</option>
          {filteredBooks.map((b) => (
            <option key={b.id} value={b.id} style={{ background: "#1e293b" }}>{b.name} ({b.price} ج)</option>
          ))}
        </select>
      </div>

      {loadingDetails && <Spinner />}

      {details && !loadingDetails && (
        <>
          {/* Summary */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div className="glass-panel" style={{ padding: "0.75rem 1.25rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>اشتروا</span>
                <span style={{ fontWeight: 700, color: "#818cf8" }}>{purchasedCount}</span>
              </div>
              <div className="glass-panel" style={{ padding: "0.75rem 1.25rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>إجمالي الإيرادات</span>
                <span style={{ fontWeight: 700, color: "#f59e0b" }}>{totalRevenue} ج</span>
              </div>
            </div>
            {selectedBook && (
              <Link
                href={`/teacher/books/${selectedBook.id}`}
                className="btn btn-secondary"
                style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", textDecoration: "none" }}
              >
                عرض صفحة تفاصيل الكتاب الكاملة ←
              </Link>
            )}
          </div>

          {/* Unavailable warning */}
          {selectedBook?.status === "unavailable" && (
            <div style={{ padding: "0.65rem 1rem", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <XCircle size={14} /> هذا الكتاب غير متاح — لا يمكن تسجيل مبيعات جديدة أو إعفاءات
            </div>
          )}

          {/* Filters */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
              <Search size={13} style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الكود..." style={{ width: "100%", padding: "0.55rem 2rem 0.55rem 0.7rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.82rem", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            {(["all", "purchased", "not_purchased"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "0.45rem 0.75rem", borderRadius: "8px", border: "1px solid", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", background: filter === f ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.03)", borderColor: filter === f ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.08)", color: filter === f ? "var(--color-teal)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                {f === "all" ? "الكل" : f === "purchased" ? "✔ اشترى" : "✖ لم يشتر"}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="glass-panel" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse", fontSize: "0.83rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {[
                      { label: "الطالب",      w: 160 },
                      { label: "الكود",       w: 90  },
                      { label: "المجموعة",    w: 100 },
                      { label: "السعر",       w: 70  },
                      { label: "الخصم",       w: 90  },
                      { label: "المدفوع",     w: 80  },
                      { label: "التاريخ",     w: 100 },
                      { label: "حالة الدفع",  w: 110 },
                      { label: "إلغاء البيع", w: 90  },
                      { label: "إعفاء",       w: 90  },
                    ].map(({ label, w }) => (
                      <th key={label} style={{ padding: "0.75rem 0.75rem", textAlign: "right", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap", minWidth: w }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s: any) => {
                    const group = groups.find((g) => g.id === s.group_id);
                    const isLoading = (k: string) => loadingAction === k;
                    const checkLoading = isLoading(s.student_id + "_sell") || isLoading(s.sale_id + "_paid") || isLoading(s.sale_id + "_unpaid");
                    const cancelLoading = isLoading(s.sale_id + "_cancel");

                    const discountPct: number = s.discount_pct
                      ?? (s.discount > 0 && s.amount > 0 ? Math.round((s.discount / s.amount) * 100) : 0);
                    const discountLabel = s.is_exempt ? "معفي 100%" : discountPct > 0 ? `خصم ${discountPct}%` : "—";
                    const discountColor = s.is_exempt ? "#818cf8" : discountPct > 0 ? "#f59e0b" : "var(--text-muted)";
                    const finalAmount = s.is_exempt || discountPct === 100 ? 0 : (s.final_price ?? null);

                    const isUnavailable = selectedBook?.status === "unavailable";
                    const isPaid = s.purchased && s.paid;
                    const checked = s.is_exempt || isPaid;
                    const checkColor = s.is_exempt ? "purple" : "teal";

                    const cell: React.CSSProperties = { padding: "0.65rem 0.75rem", whiteSpace: "nowrap" };
                    const extraSales: any[] = s.extra_sales ?? [];

                    return (
                      <React.Fragment key={s.student_id}>
                      <tr key={s.student_id} style={{ borderBottom: extraSales.length > 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ ...cell, color: "#fff", fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Link href={`/teacher/students/${s.student_id}`} style={{ color: "#fff", textDecoration: "none" }}>{s.name}</Link>
                        </td>
                        <td style={{ ...cell, color: "var(--text-muted)" }}>{s.code || "—"}</td>
                        <td style={{ ...cell, color: "var(--text-muted)" }}>{group?.name || "—"}</td>
                        <td style={{ ...cell, color: "var(--text-muted)" }}>{s.amount != null ? `${s.amount} ج` : "—"}</td>
                        <td style={{ ...cell, color: discountColor, fontWeight: discountPct > 0 || s.is_exempt ? 600 : 400 }}>{discountLabel}</td>
                        <td style={{ ...cell, color: finalAmount != null ? "var(--color-teal)" : "var(--text-muted)", fontWeight: finalAmount != null ? 600 : 400 }}>
                          {finalAmount != null ? `${finalAmount} ج` : "—"}
                        </td>
                        <td style={{ ...cell, color: "var(--text-muted)" }}>
                          {s.purchase_date ? new Date(s.purchase_date).toLocaleDateString("ar-EG") : "—"}
                        </td>

                        {/* حالة الدفع / دفع يدوي */}
                        <td style={cell}>
                          <div
                            className={`inline-flex items-center gap-1.5 ${checkLoading ? "cursor-wait opacity-60" : "cursor-pointer"}`}
                            onClick={() => {
                              if (checkLoading) return;
                              if (s.is_exempt) return;
                              if (!s.purchased) {
                                if (isUnavailable) return;
                                handleManualSell(s.student_id);
                              } else if (s.sale_id) {
                                if (s.paid) handleMarkUnpaid(s.sale_id);
                                else handleMarkPaid(s.sale_id);
                              }
                            }}
                            title={
                              s.is_exempt
                                ? "معفي كامل"
                                : !s.purchased
                                ? "اضغط لتسجيل البيع"
                                : s.paid
                                ? "اضغط للتعيين كغير مدفوع"
                                : "اضغط للتعيين كمدفوع"
                            }
                          >
                            <div className={`w-[22px] h-[22px] rounded-[7px] border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                              checked
                                ? checkColor === "purple"
                                  ? "bg-indigo-400 border-indigo-400 shadow-[0_0_0_3px_rgba(129,140,248,0.2)]"
                                  : "bg-teal-500 border-teal-500 shadow-[0_0_0_3px_rgba(20,184,166,0.2)]"
                                : checkLoading
                                  ? "border-teal-500 bg-teal-500/8"
                                  : "border-white/15 bg-white/4 hover:border-teal-500 hover:bg-teal-500/8 hover:scale-105"
                            }`}>
                              {checkLoading
                                ? <span className="w-[10px] h-[10px] rounded-full border border-teal-400/30 border-t-teal-400 animate-spin" />
                                : checked
                                  ? <Check size={13} color="#fff" strokeWidth={3} />
                                  : null}
                            </div>
                            <span style={{ fontSize: "0.72rem", color: s.is_exempt ? "#818cf8" : isPaid ? "#10b981" : s.purchased ? "#f59e0b" : "var(--text-muted)" }}>
                              {s.is_exempt ? "معفي" : isPaid ? "مدفوع" : s.purchased ? "غير مدفوع" : "لم يشتر"}
                            </span>
                          </div>
                        </td>

                        {/* إلغاء البيع */}
                        <td style={cell}>
                          {s.purchased && !s.is_exempt ? (
                            <button
                              onClick={() => handleCancelSale(s.sale_id)}
                              disabled={cancelLoading}
                              title="إلغاء عملية الشراء بالكامل"
                              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0.3rem 0.55rem", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                            >
                              {cancelLoading ? <span className="inline-block w-[10px] h-[10px] rounded-full border border-white/25 border-t-white animate-spin" /> : <Trash2 size={12} />}
                              إلغاء البيع
                            </button>
                          ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                        </td>

                        {/* إعفاء */}
                        <td style={cell}>
                          {s.is_exempt ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <span style={{ color: "#818cf8", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}><Gift size={14} /> معفي</span>
                              <button
                                onClick={() => handleCancelExempt(s.sale_id)}
                                disabled={isLoading(s.sale_id + "_cancel")}
                                title="إلغاء الإعفاء"
                                style={{ display: "flex", alignItems: "center", padding: "0.2rem 0.4rem", borderRadius: "5px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: "0.7rem", cursor: "pointer", fontFamily: "inherit" }}
                              >
                                {isLoading(s.sale_id + "_cancel") ? <span className="inline-block w-[9px] h-[9px] rounded-full border border-white/25 border-t-white animate-spin" /> : <XCircle size={11} />}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleExempt(s.student_id)}
                              disabled={isLoading(s.student_id + "_exempt") || isUnavailable}
                              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0.3rem 0.55rem", borderRadius: "6px", border: "1px solid rgba(129,140,248,0.3)", background: "rgba(129,140,248,0.08)", color: isUnavailable ? "var(--text-muted)" : "#818cf8", fontSize: "0.75rem", cursor: isUnavailable ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: isUnavailable ? 0.5 : 1, whiteSpace: "nowrap" }}
                            >
                              <Gift size={13} /> {isLoading(s.student_id + "_exempt") ? "..." : "إعفاء"}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Extra sales rows (force_resell) */}
                      {extraSales.map((es, ei) => {
                        const esCancelLoading = isLoading(es.sale_id + "_cancel");
                        return (
                          <tr key={es.sale_id} style={{ borderBottom: ei === extraSales.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: "rgba(245,158,11,0.03)" }}>
                            <td style={{ ...cell, paddingRight: "1.5rem" }} colSpan={2}>
                              <span style={{ fontSize: "0.72rem", color: "#f59e0b", display: "flex", alignItems: "center", gap: "4px" }}>
                                شراء مكرر #{ei + 2}
                              </span>
                            </td>
                            <td style={cell} />
                            <td style={{ ...cell, color: "var(--text-muted)" }}>{es.amount != null ? `${es.amount} ج` : "—"}</td>
                            <td style={{ ...cell, color: es.is_exempt ? "#818cf8" : "var(--text-muted)" }}>{es.is_exempt ? "معفي" : "—"}</td>
                            <td style={{ ...cell, color: "var(--color-teal)", fontWeight: 600 }}>
                              {es.is_exempt ? "0 ج" : es.final_price != null ? `${es.final_price} ج` : "—"}
                            </td>
                            <td style={{ ...cell, color: "var(--text-muted)" }}>
                              {es.purchase_date ? new Date(es.purchase_date).toLocaleDateString("ar-EG") : "—"}
                            </td>
                            <td style={cell}>
                              <span style={{ fontSize: "0.72rem", color: es.paid ? "#10b981" : "#f59e0b" }}>
                                {es.paid ? "مدفوع" : "غير مدفوع"}
                              </span>
                            </td>
                            <td style={cell}>
                              <button
                                onClick={() => handleCancelSale(es.sale_id)}
                                disabled={esCancelLoading}
                                title="إلغاء الشراء المكرر"
                                style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0.3rem 0.55rem", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                              >
                                {esCancelLoading ? <span className="inline-block w-[10px] h-[10px] rounded-full border border-white/25 border-t-white animate-spin" /> : <Trash2 size={12} />}
                                إلغاء
                              </button>
                            </td>
                            <td style={cell} />
                          </tr>
                        );
                      })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>لا توجد نتائج</div>
              )}
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "0.35rem 0.75rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: page === 1 ? "var(--text-muted)" : "#fff", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "0.82rem", fontFamily: "inherit" }}>السابق</button>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "0.35rem 0.75rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: page === totalPages ? "var(--text-muted)" : "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: "0.82rem", fontFamily: "inherit" }}>التالي</button>
              </div>
            )}
          </div>
        </>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
