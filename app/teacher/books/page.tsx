"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, Plus, QrCode, BarChart3, Users, TrendingUp, Tag, Gift, XCircle,
} from "lucide-react";
import { BooksService } from "@/lib/services/booksService";
import { GradesService } from "@/lib/services/gradesService";
import { GroupsService } from "@/lib/services/groupsService";
import { Book, Grade, Group } from "@/lib/types";
import { OfflineCache } from "@/lib/offlineQueue";
import { useDashboard } from "@/lib/DashboardContext";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/errors";
import BookFormModal from "./_components/BookFormModal";
import BookScanModal from "./_components/BookScanModal";
import BooksFilters from "./_components/BooksFilters";
import BooksList from "./_components/BooksList";
import BooksReportsTab from "./_components/BooksReportsTab";

type Tab = "books" | "reports";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "books",   label: "الكتب",    icon: <BookOpen size={15} /> },
  { id: "reports", label: "التقارير", icon: <BarChart3 size={15} /> },
];

export default function BooksPage() {
  const { data: dashData } = useDashboard();
  const [tab, setTab] = useState<Tab>("books");
  const [books, setBooks] = useState<Book[]>([]);
  const [grades, setGrades] = useState<Grade[]>(() => OfflineCache.loadGrades());
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCode, setFilterCode] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanBookId, setScanBookId] = useState<string | undefined>(undefined);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [report, setReport] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const load = async (skipGrades = false) => {
    try {
      const teacherId = (dashData?.teacher?.id as string | undefined);
      const [booksData, gradesData, groupsData, reportData] = await Promise.all([
        BooksService.getBooks(),
        (!skipGrades && teacherId) ? GradesService.getGradesByTeacherId(teacherId) : Promise.resolve(null),
        GroupsService.getGroupsByTeacherId(),
        BooksService.getReport(),
      ]);
      setBooks(booksData);
      setGroups(groupsData);
      if (gradesData) {
        setGrades(gradesData);
        OfflineCache.saveGrades(gradesData);
      }
      setReport(reportData);
    } catch {
      showToast("فشل تحميل الكتب", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // لو الـ grades موجودة في الـ cache نبعت skipGrades=true عشان نوفر request
    const hasGradesCache = OfflineCache.loadGrades().length > 0;
    load(hasGradesCache);
  }, []);

  const handleToggleStatus = async (book: Book) => {
    setTogglingId(book.id);
    const newStatus = book.status === "available" ? "unavailable" : "available";
    try {
      await BooksService.updateBook(book.id, { status: newStatus });
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: newStatus } : b));
      showToast(newStatus === "available" ? "تم تعيين الكتاب كمتاح" : "تم تعيين الكتاب كغير متاح");
    } catch (e: unknown) {
      showToast(getErrorMessage(e, "حدث خطأ أثناء تحديث الحالة."), "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (book: Book) => {
    if (!confirm(`هل تريد حذف "${book.name}"؟`)) return;
    try {
      await BooksService.deleteBook(book.id);
      showToast("تم حذف الكتاب");
      load(true);
    } catch (e: unknown) {
      showToast(getErrorMessage(e, "حدث خطأ أثناء حذف الكتاب."), "error");
    }
  };

  const filtered = books.filter((b) => {
    if (filterCode && !b.code?.toLowerCase().includes(filterCode.toLowerCase())) return false;
    if (filterYear && b.academic_year !== filterYear) return false;
    return true;
  });

  // استخراج السنوات الدراسية المتاحة من الكتب
  const academicYears = [...new Set(books.map(b => b.academic_year).filter(Boolean))] as string[];

  if (loading) return <Spinner fullScreen />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={20} style={{ color: "var(--color-teal)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", margin: 0 }}>إدارة الكتب</h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>{books.length} كتاب</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setShowScanModal(true)}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <QrCode size={15} /> سكان بيع
          </button>
          <button
            onClick={() => { setEditBook(null); setShowFormModal(true); }}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Plus size={15} /> إضافة كتاب
          </button>
        </div>
      </div>

      {/* ── Stats (always visible) ── */}
      {report && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
          {[
            { label: "إجمالي الكتب",      value: report.total_books,           icon: <BookOpen size={20} />,   color: "#14b8a6" },
            { label: "إجمالي المبيعات",   value: report.total_sales,           icon: <Users size={20} />,     color: "#818cf8" },
            { label: "إجمالي الإيرادات",  value: `${report.total_revenue} ج`,  icon: <TrendingUp size={20} />, color: "#f59e0b" },
            { label: "إجمالي الخصومات",   value: `${report.total_discount} ج`, icon: <Tag size={20} />,       color: "#f87171" },
            { label: "إجمالي الإعفاءات",  value: report.total_exempt,          icon: <Gift size={20} />,      color: "#a78bfa" },
            { label: "لم يشتروا أي كتاب", value: report.not_bought_count,      icon: <XCircle size={20} />,   color: "#6b7280" },
          ].map((s) => (
            <div key={s.label} className="glass-panel" style={{ padding: "0.85rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ color: s.color, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "0.35rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "0.35rem" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              padding: "0.6rem 1rem", borderRadius: "9px", border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 600,
              transition: "all 0.2s",
              background: tab === t.id ? "var(--color-teal)" : "transparent",
              color: tab === t.id ? "#fff" : "var(--text-muted)",
              boxShadow: tab === t.id ? "0 2px 12px var(--color-teal-glow)" : "none",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === "books" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <BooksFilters
            filterCode={filterCode} onFilterCode={setFilterCode}
            filterYear={filterYear} onFilterYear={setFilterYear}
            academicYears={academicYears}
          />
          <BooksList
            books={filtered}
            grades={grades}
            onEdit={(book) => { setEditBook(book); setShowFormModal(true); }}
            onDelete={handleDelete}
            onScan={(book) => { setScanBookId(book.id); setShowScanModal(true); }}
            onToggleStatus={handleToggleStatus}
            togglingId={togglingId}
          />
        </div>
      )}

      {tab === "reports" && <BooksReportsTab books={books} grades={grades} onAction={() => load(true)} />}

      {/* ── Modals ── */}
      {showFormModal && (
        <BookFormModal
          book={editBook}
          grades={grades}
          groups={groups}
          onClose={() => setShowFormModal(false)}
          onSaved={() => {
            setShowFormModal(false);
            load(true);
            showToast(editBook ? "تم تعديل الكتاب" : "تم إضافة الكتاب");
          }}
        />
      )}

      {showScanModal && (
        <BookScanModal
          books={books}
          grades={grades}
          initialBookId={scanBookId}
          onClose={() => { setShowScanModal(false); setScanBookId(undefined); }}
          onSold={() => load(true)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
