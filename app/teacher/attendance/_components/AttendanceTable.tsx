"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { Pagination } from "../../students/_components/Pagination";
import type { Student, AttendanceRecord, Group } from "@/lib/types";
import { getGroupSessionDates, getGroupSessionDatesForWeek, getWeekLabel, isSessionExpired, sessionTime } from "../_utils/sessionDates";
import { studentStatus, type AttendanceStatus } from "../_utils/attendanceView";
import { GroupTable } from "./GroupTable";
import styles from "../attendance.module.css";

interface TableProps {
  students: Student[]; sessionDates: string[]; attendance: AttendanceRecord[];
  selectedGroupId: string; selectedMonth: number; selectedYear: number; groups: Group[];
  weekOffset: number; onWeekChange: (offset: number) => void;
  viewMode?: "week" | "month"; now?: number; readOnly?: boolean;
  isPresent?: (sid: string, date: string, groupId?: string | null) => boolean;
  getAttendancePercent?: (sid: string, dates: string[], joined?: string, groupId?: string | null) => number | null;
  onToggle: (student: Student, date: string) => void;
  onMarkAll: (date: string, gid: string) => void; onClearSession: (date: string, gid: string) => void;
  onCancelSession: (gid: string, date: string, cancelled?: boolean) => void;
  onRevokeResolution?: (student: Student, date: string) => void;
  onShowQR: (student: Student) => void; onShowToast: (msg: string, type: "error") => void;
  isSaving: (gid: string, date: string) => boolean;
  isCellSaving?: (sid: string, date: string, gid?: string | null) => boolean;
}
const PAGE_SIZE = 20;
const statusOptions: [AttendanceStatus, string][] = [["all", "كل الحالات"], ["present", "حاضر"], ["absent", "غائب"], ["compensated", "معوّض"], ["exempt", "معفى"], ["pending", "بانتظار المزامنة"], ["guest", "ضيف"]];
export function AttendanceTable(p: TableProps) {
  const { students, groups, attendance, selectedMonth, selectedYear, weekOffset, sessionDates, viewMode = "week" } = p;
  const [initialNow] = useState(() => Date.now());
  const now = p.now ?? initialNow;
  const [page, setPage] = useState(1), [search, setSearch] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>("all"), [chosenDate, setChosenDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const today = new Date(now).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  const filterDate = sessionDates.includes(chosenDate) ? chosenDate : sessionDates.filter(d => d <= today).at(-1) || sessionDates[0] || "";
  const groupMap = useMemo(() => new Map(groups.map(g => [g.id, g])), [groups]);
  const filtered = useMemo(() => students.filter(s => {
    const query = search.trim().toLocaleLowerCase("ar");
    if (query && !`${s.name} ${s.code || ""} ${s.center_student_code || ""}`.toLocaleLowerCase("ar").includes(query)) return false;
    if (status === "all") return true;
    const group = groupMap.get(s.group_id || "");
    return !!group && !group.cancelled_sessions?.includes(filterDate) && studentStatus(s, filterDate, attendance, isSessionExpired(filterDate, sessionTime(group, filterDate), new Date(now))) === status;
  }), [students, search, status, groupMap, filterDate, attendance, now]);
  const blocks = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (const student of filtered) { const key = student.group_id || "no-group"; const rows = map.get(key) || []; rows.push(student); map.set(key, rows); }
    return [...map].map(([groupId, rows]) => {
      const group = groupMap.get(groupId) || null;
      const dates = group ? (viewMode === "month" ? getGroupSessionDates(group, selectedMonth, selectedYear) : getGroupSessionDatesForWeek(group, weekOffset)) : [];
      return { group, groupId, rows, dates: [...new Set([...dates, ...rows.flatMap(s => s.attendance_guest_dates || [])])].sort() };
    });
  }, [filtered, groupMap, viewMode, selectedMonth, selectedYear, weekOffset]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages), pageStart = (currentPage - 1) * PAGE_SIZE;
  let offset = 0;
  return <div className={styles.tablePanel}>
    {viewMode === "week" && <nav className={styles.weekNav} aria-label="اختيار الأسبوع">
      <button type="button" aria-label="الأسبوع السابق" onClick={() => { p.onWeekChange(weekOffset - 1); setPage(1); }}><ChevronRight size={18} /></button>
      <span>{getWeekLabel(weekOffset)}</span>
      <button type="button" aria-label="الأسبوع التالي" disabled={weekOffset >= 0} onClick={() => { p.onWeekChange(weekOffset + 1); setPage(1); }}><ChevronLeft size={18} /></button>
    </nav>}
    <div className={styles.searchRow}>
      <label className={styles.search}><Search size={17} aria-hidden="true" /><input aria-label="بحث باسم الطالب أو الكود" placeholder="اسم الطالب أو الكود" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label>
      <button type="button" className={styles.filterButton} aria-expanded={filtersOpen} aria-controls="attendance-status-filters" onClick={() => setFiltersOpen(v => !v)}><SlidersHorizontal size={17} /><span>فلترة</span>{status !== "all" && <span className={styles.dot} />}</button>
    </div>
    {filtersOpen && <div id="attendance-status-filters" className={styles.statusFilters}>
      <label><span>الحصة</span><select value={filterDate} aria-label="حصة فلتر الحالة" onChange={e => { setChosenDate(e.target.value); setPage(1); }}>{sessionDates.map(d => <option key={d} value={d}>{d}</option>)}</select></label>
      <label><span>الحالة</span><select value={status} aria-label="فلتر حالة الحضور" disabled={!filterDate} onChange={e => { setStatus(e.target.value as AttendanceStatus); setPage(1); }}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>}
    <div className={styles.tableMeta}><span>{filtered.length} نتيجة</span><span>اسحب الجدول لعرض الحصص ↔</span></div>
    {filtered.length === 0 && <p className={styles.empty}>{search || status !== "all" ? "لا توجد نتائج" : "لا يوجد طلاب"}</p>}
    {blocks.map(block => {
      const start = offset; offset += block.rows.length;
      const visible = block.rows.slice(Math.max(0, pageStart - start), Math.max(0, pageStart + PAGE_SIZE - start));
      if (!visible.length) return null;
      return <GroupTable key={block.groupId} group={block.group} groupId={block.groupId} students={visible} totalStudents={block.rows.length} sessionDates={block.dates} attendance={attendance} startIndex={Math.max(start, pageStart)}
        isPastWeek={viewMode === "week" ? weekOffset < 0 : `${selectedYear}-${String(selectedMonth).padStart(2, "0")}` < today.slice(0, 7)}
        periodLabel={viewMode === "month" ? "الشهر" : "الأسبوع"} now={now} readOnly={p.readOnly}
        isSaving={p.isSaving} isCellSaving={p.isCellSaving} onToggle={p.onToggle} onMarkAll={p.onMarkAll} onClearSession={p.onClearSession} onCancelSession={p.onCancelSession} onRevokeResolution={p.onRevokeResolution} onShowQR={p.onShowQR} onShowToast={p.onShowToast} />;
    })}
    <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
  </div>;
}
