"use client";

import { BookOpen, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BookDef, Grade } from "@/lib/types";

interface Props {
  books: BookDef[];
  grades: Grade[];
  onAdd: () => void;
  onUpdate: (id: string, field: "name" | "price" | "grade_id", value: string | number) => void;
  onRemove: (id: string) => void;
}

export function BooksSection({ books, grades, onAdd, onUpdate, onRemove }: Props) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem", color: "var(--color-info)" }}>الكتب والمذكرات</h3>
          <p className="settings-description">أضف الكتب مع تحديد سعرها وارتباطها بالسنة الدراسية.</p>
        </div>
        <Button type="button" variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={onAdd}>
          إضافة كتاب
        </Button>
      </div>

      {books.length === 0 ? (
        <div style={{ padding: "1.5rem", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
          <BookOpen size={32} style={{ opacity: 0.3, margin: "0 auto 0.5rem" }} />
          <p style={{ color: "var(--text-muted)" }}>لا توجد كتب مضافة حالياً.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {books.map((book, index) => (
            <div key={book.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", background: "rgba(15,23,42,0.4)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-color)", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <Input
                  label={`اسم الكتاب (${index + 1})`}
                  value={book.name}
                  onChange={(e) => onUpdate(book.id, "name", e.target.value)}
                  placeholder="مثال: مذكرة الشرح"
                  required
                  leftIcon={<BookOpen size={18} />}
                />
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <Input
                  label="السعر"
                  type="number"
                  min="0"
                  value={book.price}
                  onChange={(e) => onUpdate(book.id, "price", Number(e.target.value))}
                  required
                  style={{ direction: "ltr", textAlign: "right" }}
                  leftIcon={<span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>ج.م</span>}
                />
              </div>
              <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label className="form-label" style={{ marginBottom: 0 }}>السنة الدراسية (اختياري)</label>
                <select
                  className="form-input"
                  value={book.grade_id || ""}
                  onChange={(e) => onUpdate(book.id, "grade_id", e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="">كتاب عام (لا يرتبط بسنة)</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onRemove(book.id)}
                  style={{ height: "42px", color: "var(--color-danger)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                  title="حذف الكتاب"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
