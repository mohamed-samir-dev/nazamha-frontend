"use client";

import { useMemo } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineCalendarDays, HiOutlineAcademicCap, HiOutlineUserGroup } from "react-icons/hi2";
import { Grade, Group } from "@/lib/types";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedMonthIndex: number;
  setSelectedMonthIndex: (v: number) => void;
  selectedYear: number;
  setSelectedYear: (v: number) => void;
  filterGradeId: string;
  setFilterGradeId: (v: string) => void;
  filterGroupId: string;
  setFilterGroupId: (v: string) => void;
  grades: Grade[];
  filteredGroups: Group[];
  allGroups: Group[];
}

export default function ReportsFilters({
  searchQuery, setSearchQuery,
  selectedMonthIndex, setSelectedMonthIndex,
  selectedYear, setSelectedYear,
  filterGradeId, setFilterGradeId,
  filterGroupId, setFilterGroupId,
  grades, filteredGroups, allGroups,
}: Props) {
  // السنوات الدراسية الموجودة في المجموعات فقط
  const gradesInGroups = useMemo(() => {
    const gradeIds = new Set(allGroups.map((g) => g.grade_id).filter(Boolean));
    return grades.filter((g) => gradeIds.has(g.id));
  }, [grades, allGroups]);

  return (
    <div className="glass-panel sr-filters">
      <div className="sr-filters-row">
        {/* Search */}
        <div className="sr-filter-group sr-search-group">
          <span className="sr-filters-label">بحث</span>
          <div className="sr-search-wrap">
            <HiOutlineMagnifyingGlass className="sr-search-icon" size={16} />
            <input
              className="form-input sr-search-input"
              type="text"
              placeholder="ابحث بالاسم أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Month */}
        <div className="sr-filter-group">
          <span className="sr-filters-label">
            <HiOutlineCalendarDays size={12} style={{ display: "inline", marginLeft: "4px" }} />
            الشهر
          </span>
          <select
            className="form-input sr-select"
            value={selectedMonthIndex}
            onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
          >
            {arabicMonths.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="sr-filter-group" style={{ flex: "0 1 100px" }}>
          <span className="sr-filters-label">السنة</span>
          <select
            className="form-input sr-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Grade — من المجموعات فقط */}
        <div className="sr-filter-group">
          <span className="sr-filters-label">
            <HiOutlineAcademicCap size={12} style={{ display: "inline", marginLeft: "4px" }} />
            السنة الدراسية
          </span>
          <select
            className="form-input sr-select"
            value={filterGradeId}
            onChange={(e) => { setFilterGradeId(e.target.value); setFilterGroupId("all"); }}
          >
            <option value="all">كل السنوات</option>
            {gradesInGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {/* Group */}
        <div className="sr-filter-group">
          <span className="sr-filters-label">
            <HiOutlineUserGroup size={12} style={{ display: "inline", marginLeft: "4px" }} />
            المجموعة
          </span>
          <select
            className="form-input sr-select"
            value={filterGroupId}
            onChange={(e) => setFilterGroupId(e.target.value)}
          >
            <option value="all">كل المجموعات</option>
            {filteredGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
