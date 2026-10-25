/** @jest-environment jsdom */
import React from "react";

describe("Attendance Reports Logic & Helpers", () => {
  // Test formatPhone logic
  function formatPhone(raw: string): string {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("00")) p = p.slice(2);
    if (p.startsWith("0")) p = "2" + p;
    else if (p.length === 10 && (p.startsWith("10") || p.startsWith("11") || p.startsWith("12") || p.startsWith("15"))) {
      p = "20" + p;
    }
    return p;
  }

  // Test Arabic absence count formatting
  function formatAbsenceCount(count: number): string {
    if (count === 1) return "مرة واحدة";
    if (count === 2) return "مرتين";
    if (count >= 3 && count <= 10) return `${count} مرات`;
    return `${count} مرة`;
  }

  test("formatPhone properly formats Egyptian local numbers and preserves international codes", () => {
    expect(formatPhone("01012345678")).toBe("201012345678");
    expect(formatPhone("01298765432")).toBe("201298765432");
    expect(formatPhone("1012345678")).toBe("201012345678");
    expect(formatPhone("+201012345678")).toBe("201012345678");
    // International Saudi number should NOT be corrupted with 20 prefix
    expect(formatPhone("+966501234567")).toBe("966501234567");
    expect(formatPhone("00966501234567")).toBe("966501234567");
    // UAE number
    expect(formatPhone("+971501234567")).toBe("971501234567");
  });

  test("formatAbsenceCount conforms to Arabic grammar rules", () => {
    expect(formatAbsenceCount(1)).toBe("مرة واحدة");
    expect(formatAbsenceCount(2)).toBe("مرتين");
    expect(formatAbsenceCount(3)).toBe("3 مرات");
    expect(formatAbsenceCount(7)).toBe("7 مرات");
    expect(formatAbsenceCount(10)).toBe("10 مرات");
    expect(formatAbsenceCount(11)).toBe("11 مرة");
    expect(formatAbsenceCount(15)).toBe("15 مرة");
  });

  test("Students with zero sessions sort after students with valid percentages in ascending order", () => {
    const rows = [
      { id: "s1", pct: null, total: 0 },
      { id: "s2", pct: 80, total: 5 },
      { id: "s3", pct: 40, total: 5 },
      { id: "s4", pct: null, total: 0 },
    ];

    const sortedAsc = [...rows].sort((a, b) => {
      if (a.pct === null && b.pct === null) return 0;
      if (a.pct === null) return 1;
      if (b.pct === null) return -1;
      return a.pct - b.pct;
    });

    expect(sortedAsc.map((r) => r.id)).toEqual(["s3", "s2", "s1", "s4"]);
  });

  test("Month end day calculation is accurate across leap years and 30-day months", () => {
    // February 2024 (Leap year)
    expect(new Date(2024, 2, 0).getDate()).toBe(29);
    // February 2026 (Common year)
    expect(new Date(2026, 2, 0).getDate()).toBe(28);
    // April (30 days)
    expect(new Date(2026, 4, 0).getDate()).toBe(30);
    // October (31 days)
    expect(new Date(2026, 10, 0).getDate()).toBe(31);
  });
});
