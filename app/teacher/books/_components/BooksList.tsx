"use client";

import { BookOpen } from "lucide-react";
import { Book, Grade } from "@/lib/types";
import BookCard from "./BookCard";

interface Props {
  books: Book[];
  grades: Grade[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onScan: (book: Book) => void;
  onToggleStatus: (book: Book) => void;
  togglingId?: string | null;
}

export default function BooksList({ books, grades, onEdit, onDelete, onScan, onToggleStatus, togglingId }: Props) {
  if (books.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
        <BookOpen size={40} style={{ marginBottom: "1rem", opacity: 0.4 }} />
        <p style={{ margin: 0 }}>لا توجد كتب</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          grades={grades}
          onEdit={() => onEdit(book)}
          onDelete={() => onDelete(book)}
          onScan={() => onScan(book)}
          onToggleStatus={() => onToggleStatus(book)}
          toggling={togglingId === book.id}
        />
      ))}
    </div>
  );
}
