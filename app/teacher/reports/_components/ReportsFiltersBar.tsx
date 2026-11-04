"use client";

import React from "react";
import { Filter, Calendar, Printer, RotateCcw, GraduationCap, Users } from "lucide-react";
import type { PeriodType, AcademicYearOption } from "../_types/financialTypes";
import type { Grade, Group, SubTeacher } from "@/lib/types";
import { ARABIC_MONTHS } from "../_utils/financialCalculations";

interface Props {
  periodType: PeriodType;
  setPeriodType: (p: PeriodType) => void;
  selectedAcademicYear: string;
  setSelectedAcademicYear: (y: string) => void;
  academicYearOptions: AcademicYearOption[];
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  selectedGradeId: string;
  setSelectedGradeId: (g: string) => void;
  selectedGroupId: string;
  setSelectedGroupId: (g: string) => void;
  selectedTeacherId: string;
  setSelectedTeacherId: (t: string) => void;
  grades: Grade[];
  groups: Group[];
  subTeachers: SubTeacher[];
  hasCenterMode: boolean;
  totalStudentsCount: number;
  periodLabel: string;
  onResetFilters: () => void;
  onPrint: () => void;
}

export function ReportsFiltersBar({
  periodType,
  setPeriodType,
  selectedAcademicYear,
  setSelectedAcademicYear,
  academicYearOptions,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedGradeId,
  setSelectedGradeId,
  selectedGroupId,
  setSelectedGroupId,
  selectedTeacherId,
  setSelectedTeacherId,
  grades,
  groups,
  subTeachers,
  hasCenterMode,
  totalStudentsCount,
  periodLabel,
  onResetFilters,
  onPrint,
}: Props) {
  // Filter groups by stage if stage is selected
  const availableGroups = React.useMemo(() => {
    if (selectedGradeId === "all") return groups;
    return groups.filter((g) => g.grade_id === selectedGradeId);
  }, [groups, selectedGradeId]);

  return (
    <div
      className="glass-panel"
      style={{
        padding: "0.85rem 1.15rem",
        marginBottom: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
      }}
    >
      {/* Top Filter Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        {/* Filter Icon & Label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--color-teal)",
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
        >
          <Filter size={15} />
          <span>الفترة:</span>
        </div>

        {/* Period Type Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <select
            className="form-input"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            style={{
              padding: "0.38rem 0.75rem",
              borderRadius: 8,
              fontSize: "0.82rem",
              fontWeight: 600,
              background: "rgba(15, 23, 42, 0.7)",
              borderColor: periodType === "current_month" ? "var(--color-teal)" : "var(--border-color)",
              color: periodType === "current_month" ? "var(--color-teal)" : "inherit",
              width: "auto",
            }}
          >
            <option value="current_month">الشهر الحالي (افتراضي)</option>
            <option value="specific_month">شهر محدد</option>
            <option value="current_academic_year">السنة الأكاديمية الحالية</option>
            <option value="previous_academic_year">سنة أكاديمية سابقة</option>
          </select>
        </div>

        {/* Dynamic Period Inputs */}
        {periodType === "specific_month" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <select
                className="form-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ padding: "0.38rem 0.65rem", borderRadius: 8, fontSize: "0.82rem", width: "auto" }}
              >
                {ARABIC_MONTHS.map((m, idx) => (
                  <option key={idx} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <select
                className="form-input"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ padding: "0.38rem 0.65rem", borderRadius: 8, fontSize: "0.82rem", width: "auto" }}
              >
                {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {(periodType === "current_academic_year" || periodType === "previous_academic_year") && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Calendar size={14} style={{ color: "var(--text-muted)" }} />
            <select
              className="form-input"
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              style={{ padding: "0.38rem 0.65rem", borderRadius: 8, fontSize: "0.82rem", width: "auto" }}
            >
              {academicYearOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label} {opt.isCurrent ? "(الحالية)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stage Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <GraduationCap size={14} style={{ color: "var(--text-muted)" }} />
          <select
            className="form-input"
            value={selectedGradeId}
            onChange={(e) => {
              setSelectedGradeId(e.target.value);
              setSelectedGroupId("all");
            }}
            style={{ padding: "0.38rem 0.65rem", borderRadius: 8, fontSize: "0.82rem", width: "auto" }}
          >
            <option value="all">كل المراحل الدراسية</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Group Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <Users size={14} style={{ color: "var(--text-muted)" }} />
          <select
            className="form-input"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            style={{ padding: "0.38rem 0.65rem", borderRadius: 8, fontSize: "0.82rem", width: "auto" }}
          >
            <option value="all">كل المجموعات</option>
            {availableGroups.map((grp) => (
              <option key={grp.id} value={grp.id}>
                {grp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Center Sub-teacher Filter */}
        {hasCenterMode && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>المعلم:</span>
            <select
              className="form-input"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              style={{ padding: "0.38rem 0.65rem", borderRadius: 8, fontSize: "0.82rem", width: "auto" }}
            >
              <option value="all">كل المعلمين</option>
              {subTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset button */}
        {(periodType !== "current_month" ||
          selectedGradeId !== "all" ||
          selectedGroupId !== "all" ||
          selectedTeacherId !== "all") && (
          <button
            onClick={onResetFilters}
            className="btn btn-secondary"
            style={{
              padding: "0.35rem 0.6rem",
              borderRadius: 8,
              fontSize: "0.78rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
            title="إعادة ضبط الفلاتر للشهر الحالي"
          >
            <RotateCcw size={12} />
            <span>إعادة ضبط</span>
          </button>
        )}

        {/* Print Action Button */}
        <div style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={onPrint}
            className="btn btn-primary"
            style={{
              padding: "0.42rem 0.95rem",
              borderRadius: 8,
              fontSize: "0.82rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              background: "var(--color-teal)",
              borderColor: "var(--color-teal)",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(20, 184, 166, 0.25)",
            }}
          >
            <Printer size={15} />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Filter Info / Status Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.76rem",
          color: "var(--text-muted)",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          paddingTop: "0.5rem",
          flexWrap: "wrap",
          gap: "0.4rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ color: "var(--color-teal)", fontWeight: 700 }}>● {periodLabel}</span>
          <span>·</span>
          <span>{totalStudentsCount} طالب في النطاق المحدد</span>
          {selectedGradeId !== "all" && (
            <>
              <span>·</span>
              <span>المرحلة: {grades.find((g) => g.id === selectedGradeId)?.name}</span>
            </>
          )}
          {selectedGroupId !== "all" && (
            <>
              <span>·</span>
              <span>المجموعة: {groups.find((g) => g.id === selectedGroupId)?.name}</span>
            </>
          )}
        </div>
        <div>
          <span>الأرقام تستند لتواريخ المعاملات الفعلية</span>
        </div>
      </div>
    </div>
  );
}
