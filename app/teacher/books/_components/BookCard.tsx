"use client";

import { BookOpen, Edit2, QrCode, Trash2, Users, TrendingUp, Hash, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { Book, Grade } from "@/lib/types";

interface Props {
  book: Book;
  grades: Grade[];
  onEdit: () => void;
  onDelete: () => void;
  onScan: () => void;
  onToggleStatus: () => void;
  toggling?: boolean;
}

// لون مميز لكل كتاب بناءً على اسمه
function getBookAccent(name: string) {
  const colors = [
    { bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.3)", text: "#14b8a6", glow: "rgba(20,184,166,0.15)" },
    { bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.3)", text: "#818cf8", glow: "rgba(129,140,248,0.15)" },
    { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", text: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
    { bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.3)", text: "#ec4899", glow: "rgba(236,72,153,0.15)" },
    { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", text: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
    { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", text: "#10b981", glow: "rgba(16,185,129,0.15)" },
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function BookCard({ book, grades, onEdit, onDelete, onScan, onToggleStatus, toggling }: Props) {
  const grade = grades.find((g) => g.id === book.grade_id);
  const isAvailable = book.status === "available";
  const accent = getBookAccent(book.name);

  return (
    <div style={{
      background: "rgba(15,23,42,0.7)",
      border: `1px solid ${accent.border}`,
      borderRadius: "16px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.2s, box-shadow 0.2s",
      boxShadow: `0 4px 24px rgba(0,0,0,0.3)`,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${accent.border}`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.3)"; }}
    >
      {/* ── Top accent bar ── */}
      <div style={{ height: "3px", background: `linear-gradient(90deg, ${accent.text}, transparent)` }} />

      {/* ── Body ── */}
      <div style={{ padding: "1.1rem 1.1rem 0.85rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.85rem" }}>

        {/* Icon + Name + Badges */}
        <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
          {/* Book icon box */}
          <div style={{
            width: 48, height: 48, borderRadius: "12px", flexShrink: 0,
            background: accent.bg, border: `1px solid ${accent.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen size={22} style={{ color: accent.text }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges row */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
              <span style={{
                fontSize: "0.62rem", padding: "2px 8px", borderRadius: "20px", fontWeight: 700,
                background: isAvailable ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                color: isAvailable ? "#10b981" : "#f87171",
                border: `1px solid ${isAvailable ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                letterSpacing: "0.02em",
              }}>
                {isAvailable ? "● متاح" : "● غير متاح"}
              </span>
              {grade && (
                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {grade.name}
                </span>
              )}
            </div>

            {/* Name */}
            <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#f1f5f9", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
              {book.name}
            </h3>

            {/* Price */}
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: accent.text, marginTop: "0.2rem", letterSpacing: "-0.01em" }}>
              {book.price.toLocaleString("ar-EG")} <span style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.8 }}>جنيه</span>
            </div>
          </div>
        </div>

        {/* ── Meta row: code + year ── */}
        {(book.code || book.academic_year) && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {book.code && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.65rem", borderRadius: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Hash size={11} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.05em" }}>{book.code}</span>
              </div>
            )}
            {book.academic_year && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.65rem", borderRadius: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Calendar size={11} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{book.academic_year}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <div style={{ padding: "0.55rem 0.75rem", borderRadius: "10px", background: "rgba(129,140,248,0.07)", border: "1px solid rgba(129,140,248,0.15)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={14} style={{ color: "#818cf8", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#818cf8", lineHeight: 1 }}>{book.buyers_count ?? 0}</div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "1px" }}>مشتري</div>
            </div>
          </div>
          <div style={{ padding: "0.55rem 0.75rem", borderRadius: "10px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f59e0b", lineHeight: 1 }}>{(book.total_revenue ?? 0).toLocaleString("ar-EG")}</div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "1px" }}>إيرادات</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toggle status bar ── */}
      <div style={{ padding: "0.5rem 1.1rem", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.1)" }}>
        <button
          onClick={onToggleStatus}
          disabled={toggling}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            padding: "0.4rem", borderRadius: "8px", cursor: toggling ? "wait" : "pointer",
            fontFamily: "inherit", fontSize: "0.75rem", fontWeight: 600, border: "1px solid",
            transition: "background 0.15s",
            background: isAvailable ? "rgba(239,68,68,0.07)" : "rgba(16,185,129,0.07)",
            borderColor: isAvailable ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)",
            color: isAvailable ? "#f87171" : "#10b981",
            opacity: toggling ? 0.6 : 1,
          }}
        >
          {isAvailable
            ? <><ToggleLeft size={14} /> تعيين كغير متاح</>
            : <><ToggleRight size={14} /> تعيين كمتاح</>}
        </button>
      </div>

      {/* ── Actions footer ── */}
      <div style={{ padding: "0.65rem 1.1rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "0.4rem", background: "rgba(0,0,0,0.15)", flexWrap: "wrap" }}>
        <button onClick={onEdit} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", padding: "0.45rem", borderRadius: "8px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", color: "#f59e0b", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>
          <Edit2 size={13} /> تعديل
        </button>
        <button
          onClick={isAvailable ? onScan : undefined}
          disabled={!isAvailable}
          title={!isAvailable ? "الكتاب غير متاح" : undefined}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", padding: "0.45rem", borderRadius: "8px", background: isAvailable ? accent.bg : "rgba(255,255,255,0.04)", border: `1px solid ${isAvailable ? accent.border : "rgba(255,255,255,0.08)"}`, color: isAvailable ? accent.text : "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, cursor: isAvailable ? "pointer" : "not-allowed", fontFamily: "inherit", opacity: isAvailable ? 1 : 0.5, transition: "background 0.15s" }}>
          <QrCode size={13} /> بيع
        </button>
        <button onClick={onDelete} style={{ padding: "0.45rem 0.6rem", borderRadius: "8px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
