"use client";

import { PiBookOpenTextLight } from "react-icons/pi";
import { RiGroupLine } from "react-icons/ri";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
import { Group } from "@/lib/types";
import { getAcademicYear } from "@/lib/groupUtils";
import { useRef, useState, useEffect } from "react";

interface AcademicYearTabsProps {
  years: string[];
  activeYear: string;
  currentYear: string;
  groups: Group[];
  onSelect: (year: string) => void;
}

export function AcademicYearTabs({ years, activeYear, currentYear, groups, onSelect }: AcademicYearTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => { el?.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, [years]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div style={{ marginBottom: "1.75rem" }}>
      {/* header label */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <PiBookOpenTextLight size={16} style={{ color: "var(--text-muted)" }} />
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.04em" }}>
          السنة الدراسية
        </span>
      </div>

      {/* scroll wrapper */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        {canScrollLeft && (
          <button onClick={() => scroll("left")} style={arrowBtn}>
            <TbChevronRight size={16} />
          </button>
        )}

        <div
          ref={scrollRef}
          style={{
            display: "flex", gap: "0.6rem", overflowX: "auto", flex: 1,
            scrollbarWidth: "none", msOverflowStyle: "none",
            paddingBottom: "2px",
          }}
        >
          {years.map((year) => {
            const isActive = year === activeYear;
            const isCurrent = year === currentYear;
            const count = groups.filter(
              (g) => getAcademicYear(new Date(g.created_at || Date.now())) === year
            ).length;

            return (
              <button
                key={year}
                onClick={() => onSelect(year)}
                style={{
                  flexShrink: 0,
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.65rem 1.2rem",
                  borderRadius: "14px",
                  border: isActive
                    ? "1px solid var(--color-teal)"
                    : "1px solid rgba(255,255,255,0.07)",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0.08) 100%)"
                    : "rgba(255,255,255,0.025)",
                  color: isActive ? "var(--color-teal)" : "var(--text-secondary)",
                  cursor: "pointer", fontFamily: "inherit",
                  fontSize: "0.88rem", fontWeight: isActive ? 700 : 400,
                  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                  position: "relative",
                  boxShadow: isActive ? "0 0 20px rgba(20,184,166,0.12), inset 0 1px 0 rgba(20,184,166,0.15)" : "none",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.055)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                {/* current badge */}


                {/* icon */}
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "28px", height: "28px", borderRadius: "8px",
                  background: isActive ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.05)",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}>
                  <PiBookOpenTextLight size={15} style={{ color: isActive ? "var(--color-teal)" : "var(--text-muted)" }} />
                </span>

                {/* year text */}
                <span style={{ letterSpacing: "0.02em" }}>{year}</span>

                {/* count badge */}
                {count > 0 ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "3px",
                    padding: "2px 8px", borderRadius: "999px",
                    background: isActive ? "rgba(20,184,166,0.22)" : "rgba(255,255,255,0.06)",
                    color: isActive ? "var(--color-teal)" : "var(--text-muted)",
                    fontSize: "0.72rem", fontWeight: 700,
                    border: isActive ? "1px solid rgba(20,184,166,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <RiGroupLine size={10} />
                    {count}
                  </span>
                ) : (
                  <span style={{
                    padding: "2px 8px", borderRadius: "999px",
                    background: "rgba(255,255,255,0.03)",
                    color: "var(--text-muted)",
                    fontSize: "0.7rem",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    فارغة
                  </span>
                )}

                {/* active indicator line */}
                {isActive && (
                  <span style={{
                    position: "absolute", bottom: "-1px", left: "20%", right: "20%",
                    height: "2px", borderRadius: "999px",
                    background: "linear-gradient(90deg, transparent, var(--color-teal), transparent)",
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <button onClick={() => scroll("right")} style={arrowBtn}>
            <TbChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* divider */}
      <div style={{
        marginTop: "1rem", height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)",
      }} />
    </div>
  );
}

const arrowBtn: React.CSSProperties = {
  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
  width: "30px", height: "30px", borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--text-secondary)", cursor: "pointer",
};
