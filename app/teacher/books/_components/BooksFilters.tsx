"use client";

import { Hash, Calendar } from "lucide-react";

interface Props {
  filterCode: string;
  onFilterCode: (v: string) => void;
  filterYear: string;
  onFilterYear: (v: string) => void;
  academicYears: string[];
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 2.2rem 0.6rem 0.75rem",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  padding: "0.6rem 0.75rem",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  width: "100%",
};

export default function BooksFilters({ filterCode, onFilterCode, filterYear, onFilterYear, academicYears }: Props) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {/* Code filter */}
      <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
        <Hash size={14} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          value={filterCode}
          onChange={(e) => onFilterCode(e.target.value)}
          placeholder="فلتر بالكود..."
          style={inputStyle}
        />
      </div>

      {/* Academic year filter */}
      <div style={{ position: "relative" }}>
        <Calendar size={14} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <select
          value={filterYear}
          onChange={(e) => onFilterYear(e.target.value)}
          style={{ ...selectStyle, paddingRight: "2.2rem" }}
        >
          <option value="">كل السنوات الدراسية</option>
          {academicYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}
