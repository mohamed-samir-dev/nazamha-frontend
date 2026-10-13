"use client";

import { useState, useMemo } from "react";
import {
  HiOutlineChevronRight, HiOutlineChevronLeft,
  HiOutlineChevronUp, HiOutlineChevronDown,
  HiOutlineExclamationCircle, HiOutlineExclamationTriangle, HiOutlineCreditCard,
} from "react-icons/hi2";
import { RiMedalFill } from "react-icons/ri";
import { LuInbox, LuPrinter } from "react-icons/lu";
import { PAGE_SIZE } from "../_hooks/useStudentReports";
import { TableProps, AlertItem, SortKey, SortDir } from "./types";
import { getConsecutiveAbsences, getAlerts } from "./reportUtils";
import { printStudentReport } from "./printReport";
import { Exam } from "@/lib/types";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "attendancePct", label: "نسبة الحضور" },
  { key: "absent", label: "عدد الغياب" },
  { key: "name", label: "الاسم" },
  { key: "lastAttendance", label: "آخر حضور" },
];

function AlertIcon({ type, title }: AlertItem) {
  if (type === "star") return <RiMedalFill size={17} color="#fbbf24" title={title} className="sr-alert-icon" />;
  if (type === "expulsion") return <HiOutlineExclamationCircle size={17} color="#ef4444" title={title} className="sr-alert-icon" />;
  if (type === "absence") return <HiOutlineExclamationTriangle size={17} color="#f59e0b" title={title} className="sr-alert-icon" />;
  return <HiOutlineCreditCard size={17} color="#ef4444" title={title} className="sr-alert-icon" />;
}

export default function StudentsReportTable({
  students, grades, groups, teacherBooks, getAttendance,
  isStudentPaid, lastAttendanceMap, last10Sessions,
  studentSubsInfo, selectedMonthIndex, selectedYear,
  page, totalPages, setPage, totalFiltered, onSendWhatsApp,
  getLastExam,
}: TableProps & { getLastExam?: (id: string) => (Exam & { score: number | null }) | null }) {
  const [sortKey, setSortKey] = useState<SortKey>("attendancePct");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = useMemo(() => [...students].sort((a, b) => {
    const attA = getAttendance(a.id);
    const attB = getAttendance(b.id);
    const pctA = attA.total > 0 ? attA.present / attA.total : 0;
    const pctB = attB.total > 0 ? attB.present / attB.total : 0;
    let cmp = 0;
    if (sortKey === "attendancePct") cmp = pctA - pctB;
    else if (sortKey === "absent") cmp = attA.absent - attB.absent;
    else if (sortKey === "name") cmp = a.name.localeCompare(b.name, "ar");
    else if (sortKey === "lastAttendance") {
      const dA = lastAttendanceMap.get(a.id) ?? "";
      const dB = lastAttendanceMap.get(b.id) ?? "";
      cmp = dA.localeCompare(dB);
    }
    return sortDir === "asc" ? cmp : -cmp;
  }), [students, sortKey, sortDir, getAttendance, lastAttendanceMap]);

  return (
    <div className="glass-panel sr-table-panel">
      {/* Legend */}
      <div className="sr-legend">
        <span className="sr-legend-title">دليل التنبيهات:</span>
        <span className="sr-legend-item"><RiMedalFill size={15} color="#fbbf24" /> طالب متميز (حضور 90%+ ومدفوع)</span>
        <span className="sr-legend-item"><HiOutlineExclamationCircle size={15} color="#ef4444" /> معرض للفصل (حضور &lt; 50%)</span>
        <span className="sr-legend-item"><HiOutlineExclamationTriangle size={15} color="#f59e0b" /> غياب 3 أيام أو أكثر</span>
        <span className="sr-legend-item"><HiOutlineCreditCard size={15} color="#ef4444" /> متأخر شهرين أو أكثر في الدفع</span>
      </div>

      {/* Sort controls */}
      <div className="sr-sort-bar">
        <span className="sr-sort-label">ترتيب حسب:</span>
        <div className="sr-sort-chips">
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              className={`sr-sort-chip ${sortKey === key ? "active" : ""}`}
              onClick={() => handleSort(key)}
            >
              {label}
              {sortKey === key && (sortDir === "asc" ? <HiOutlineChevronUp size={12} /> : <HiOutlineChevronDown size={12} />)}
            </button>
          ))}
        </div>
      </div>

      <div className="sr-table-wrap">
        <table className="sr-table">
          <thead>
            <tr>
              <th>#</th>
              <th style={{ textAlign: "right" }}>الطالب</th>
              <th>حضور</th>
              <th>غياب</th>
              <th>النسبة</th>
              <th>آخر شهر دفع</th>
              <th>متأخرات</th>
              <th>تنبيهات</th>
              <th>آخر امتحان</th>
              <th>طباعة</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <div className="sr-empty">
                    <LuInbox size={44} />
                    <span className="sr-empty-title">لا يوجد طلاب مطابقون</span>
                    <span className="sr-empty-sub">جرّب تغيير الفلاتر أو البحث بكلمة مختلفة</span>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((student, idx) => {
                const att = getAttendance(student.id);
                const total = att.total;
                const pct = total > 0 ? Math.round((att.present / total) * 100) : 0;
                const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                const gradeName = grades.find((g) => g.id === student.grade_id)?.name ?? "—";
                const groupName = groups.find((g) => g.id === student.group_id)?.name ?? "—";
                const subsInfo = studentSubsInfo.get(student.id) ?? { lastPaidMonth: "—", arrears: 0, hasAllPaid: true };
                const { lastPaidMonth, arrears } = subsInfo;
                const consAbsences = getConsecutiveAbsences(student.id, last10Sessions, getAttendance);
                const paid = isStudentPaid(student.id);
                const alerts = getAlerts(student, att, pct, arrears, consAbsences, paid, subsInfo.hasAllPaid);
                const receivedBookNames = (student.received_books || [])
                  .map((bid) => teacherBooks.find((b) => b.id === bid)?.name)
                  .filter(Boolean) as string[];
                const lastExam = getLastExam ? getLastExam(student.id) : null;
                const examPct = lastExam?.score !== null && lastExam?.score !== undefined && lastExam?.max_score
                  ? Math.round((lastExam.score / lastExam.max_score) * 100) : null;
                const examColor = examPct === null ? "var(--text-muted)" : examPct >= 85 ? "#10b981" : examPct >= 50 ? "#f59e0b" : "#ef4444";

                return (
                  <tr key={student.id} className={pct < 50 && total > 0 ? "sr-row-atrisk" : att.absent > 3 ? "sr-row-unpaid" : ""}>
                    <td className="sr-td-num">{rowNum}</td>
                    <td>
                      <div className="sr-student-cell">
                        <div className="sr-student-info">
                          <span className="sr-student-name">{student.name}</span>
                          {student.code && <span className="sr-student-code">{student.code}</span>}
                        </div>
                      </div>
                    </td>
                    <td><span className="sr-present">{att.present}</span></td>
                    <td><span className={att.absent > 0 ? "sr-absent" : "sr-zero"}>{att.absent}</span></td>
                    <td>
                      <div className="sr-progress-wrap">
                        <div className="sr-progress-bar">
                          <div
                            className="sr-progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444",
                            }}
                          />
                        </div>
                        <span className="sr-progress-pct">{pct}%</span>
                      </div>
                    </td>
                    <td><span className="sr-last-date">{lastPaidMonth}</span></td>
                    <td>
                      {arrears > 0
                        ? <span className="sr-arrears-badge">{arrears} شهر</span>
                        : <span className="sr-zero">—</span>}
                    </td>
                    <td>
                      <div className="sr-badges-row">
                        {alerts.map((a, i) => <AlertIcon key={i} {...a} />)}
                      </div>
                    </td>
                    <td style={{ minWidth: 110 }}>
                      {lastExam ? (
                        <div style={{ fontSize: "0.78rem", lineHeight: 1.4 }}>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }} title={lastExam.title}>
                            {lastExam.title}
                          </div>
                          {lastExam.score !== null ? (
                            <span style={{ fontWeight: 700, color: examColor }}>
                              {lastExam.score}/{lastExam.max_score}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>لم يُرصد</span>
                          )}
                        </div>
                      ) : (
                        <span className="sr-zero">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="sr-print-btn"
                        title="طباعة تقرير الطالب"
                        onClick={() => printStudentReport(
                          student, att, pct, lastPaidMonth, arrears,
                          gradeName, groupName, selectedMonthIndex, selectedYear,
                          alerts, receivedBookNames,
                          getLastExam ? getLastExam(student.id) : null
                        )}
                      >
                        <LuPrinter size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="sr-pagination">
          <span className="sr-page-info">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalFiltered)} من {totalFiltered} طالب
          </span>
          <div className="sr-page-btns">
            <button className="sr-page-btn" onClick={() => setPage(page - 1)} disabled={page === 1}>
              <HiOutlineChevronRight size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="sr-page-dots">…</span>
                ) : (
                  <button
                    key={p}
                    className={`sr-page-btn ${page === p ? "active" : ""}`}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </button>
                )
              )}
            <button className="sr-page-btn" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
              <HiOutlineChevronLeft size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
