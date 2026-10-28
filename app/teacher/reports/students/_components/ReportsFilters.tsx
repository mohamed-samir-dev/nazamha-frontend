"use client";

import { useMemo } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineCalendarDays, HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineCreditCard } from "react-icons/hi2";
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
  filterPayment: "all" | "paid" | "unpaid";
  setFilterPayment: (v: "all" | "paid" | "unpaid") => void;
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
  filterPayment, setFilterPayment,
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
          <label className="sr-filters-label" htmlFor="filter-search-input">بحث</label>
          <div className="sr-search-wrap">
            <HiOutlineMagnifyingGlass className="sr-search-icon" size={16} />
            <input
              id="filter-search-input"
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
          <label className="sr-filters-label" htmlFor="filter-month-select">
            <HiOutlineCalendarDays size={12} style={{ display: "inline", marginLeft: "4px" }} />
            الشهر
          </label>
          <select
            id="filter-month-select"
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
          <label className="sr-filters-label" htmlFor="filter-year-select">السنة</label>
          <select
            id="filter-year-select"
            className="form-input sr-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Grade */}
        <div className="sr-filter-group">
          <label className="sr-filters-label" htmlFor="filter-grade-select">
            <HiOutlineAcademicCap size={12} style={{ display: "inline", marginLeft: "4px" }} />
            السنة الدراسية
          </label>
          <select
            id="filter-grade-select"
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
          <label className="sr-filters-label" htmlFor="filter-group-select">
            <HiOutlineUserGroup size={12} style={{ display: "inline", marginLeft: "4px" }} />
            المجموعة
          </label>
          <select
            id="filter-group-select"
            className="form-input sr-select"
            value={filterGroupId}
            onChange={(e) => setFilterGroupId(e.target.value)}
          >
            <option value="all">كل المجموعات</option>
            {filteredGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {/* Payment Filter */}
        <div className="sr-filter-group">
          <label className="sr-filters-label" htmlFor="filter-payment-select">
            <HiOutlineCreditCard size={12} style={{ display: "inline", marginLeft: "4px" }} />
            حالة الدفع
          </label>
          <select
            id="filter-payment-select"
            className="form-input sr-select"
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value as "all" | "paid" | "unpaid")}
          >
            <option value="all">كل الطلاب</option>
            <option value="paid">مسددين فقط ✅</option>
            <option value="unpaid">متأخرات / غير مسددين ⚠️</option>
          </select>
        </div>
      </div>
    </div>
  );
}
