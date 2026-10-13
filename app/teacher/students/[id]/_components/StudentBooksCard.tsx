"use client";

import { useState, useEffect } from "react";
import { BookOpen, CheckCircle } from "lucide-react";
import { Student } from "@/lib/types";
import { BooksService } from "@/lib/services/booksService";

interface Props {
  student: Student;
  books?: any[];
  onToggleBook?: (bookId: string) => void;
}

export function StudentBooksCard({ student }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    BooksService.getStudentBooks(student.id)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [student.id]);

  if (loading) return (
    <div className="glass-panel panel-content" style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
      جاري التحميل...
    </div>
  );

  const purchased = rows.filter((r) => r.purchased);

  if (purchased.length === 0) return (
    <div className="glass-panel panel-content" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
      <BookOpen size={32} style={{ marginBottom: "0.75rem", opacity: 0.4 }} />
      <p style={{ margin: 0 }}>لم يشترِ الطالب أي كتاب بعد</p>
    </div>
  );

  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title">
        <BookOpen size={16} style={{ color: "var(--color-teal)" }} />
        <span>الكتب المشتراة</span>
        <span style={{ marginRight: "auto", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 400 }}>
          {purchased.length} كتاب
        </span>
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {purchased.map((row) => (
          <div
            key={row.book_id}
            className="student-book-row"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.75rem 1rem", borderRadius: "10px",
              border: "1px solid rgba(16,185,129,0.25)",
              background: "rgba(16,185,129,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
              <CheckCircle size={15} style={{ color: "#10b981", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.88rem", color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1px" }}>
                  {row.purchase_date ? new Date(row.purchase_date).toLocaleDateString("ar-EG") : ""}
                  {row.receipt_number ? ` · فاتورة ${row.receipt_number}` : ""}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
              <div style={{ textAlign: "left" }}>
                {row.is_exempt ? (
                  <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600 }}>إعفاء</span>
                ) : (
                  <>
                    {row.discount > 0 && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textDecoration: "line-through" }}>{row.price} ج</div>}
                    <div style={{ fontSize: "0.85rem", color: "var(--color-teal)", fontWeight: 700 }}>{row.amount} ج</div>
                  </>
                )}
                <div style={{ fontSize: "0.68rem", color: row.paid ? "#10b981" : "#f59e0b" }}>
                  {row.paid ? "مدفوع" : "غير مدفوع"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
