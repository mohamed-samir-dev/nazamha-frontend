"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LoaderCircle, ScanLine } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import type { Student } from "@/lib/types";
import { useAttendanceData } from "./_hooks/useAttendanceData";
import { useAttendanceActions } from "./_hooks/useAttendanceActions";
import { AttendanceFilters } from "./_components/AttendanceFilters";
import { AttendanceStats } from "./_components/AttendanceStats";
import { AttendanceTable } from "./_components/AttendanceTable";
import { QRModal } from "./_components/QRModal";
import { AttendancePrintButton } from "./_components/AttendancePrintButton";
import { exportAttendancePrint } from "./_utils/exportUtils";
import { useOnlineSync } from "./scan/_hooks/useOnlineSync";
import styles from "./attendance.module.css";
const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default function AttendancePage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => setToast({ message, type });
  const data = useAttendanceData();
  useOnlineSync(count => { if (count) void data.loadAttendance(); });
  const actions = useAttendanceActions({ userId: data.userId, attendance: data.attendance, setAttendance: data.setAttendance, filteredStudents: data.filteredStudents, showToast, updateGroupLocally: data.updateGroupLocally,
    weekOffset: data.viewMode === "week" ? data.weekOffset : data.reportPeriod < data.today.slice(0, 7) ? -1 : 0, readOnly: data.readOnly, onRefresh: data.loadAttendance });
  const selectedGroup = data.groups.find(g => g.id === data.selectedGroupId);
  const changeMonth = (step: number) => {
    const date = new Date(Date.UTC(data.selectedYear, data.selectedMonth - 1 + step, 1));
    data.setReportPeriod(date.toISOString().slice(0, 7));
  };
  if (data.loading) return <Spinner fullScreen />;
  return <main className={styles.page}>
    <header className={styles.header}>
      <div><h1>سجل الحضور</h1><p>{selectedGroup?.name || "كل المجموعات"}</p></div>
      <div className={styles.headerActions}>
        <AttendancePrintButton onPrint={() => exportAttendancePrint(data.monthlyStudents, data.monthSessionDates, data.attendance, data.selectedMonth, data.selectedYear, selectedGroup?.name || "كل المجموعات", data.groups, new Set(selectedGroup?.cancelled_sessions || []), { gradeId: data.selectedGradeId, groupId: data.selectedGroupId })} onError={message => showToast(message, "error")} />
        <Link href="/teacher/attendance/scan" className={styles.scanLink}><ScanLine size={18} aria-hidden="true" /><span>سكان QR</span></Link>
      </div>
    </header>
    {data.error && <div className={styles.notice} role="status"><span>{data.error}</span><button type="button" onClick={data.retry}>إعادة المحاولة</button></div>}
    <AttendanceFilters grades={data.grades} groups={data.groups} selectedGradeId={data.selectedGradeId} selectedGroupId={data.selectedGroupId} onGradeChange={value => { data.setSelectedGradeId(value); data.setSelectedGroupId("all"); }} onGroupChange={data.setSelectedGroupId} />
    <section className={styles.periodPanel} aria-label="فترة الحضور والتقرير">
      <div className={styles.monthPicker}>
        <button type="button" aria-label="الشهر السابق" onClick={() => changeMonth(-1)} disabled={data.reportPeriod <= "2000-01"}><ChevronRight size={18} /></button>
        <select aria-label="شهر الحضور والتقرير" value={data.reportPeriod} onChange={e => data.setReportPeriod(e.target.value)}>{Array.from({ length: 4 }, (_, i) => data.selectedYear - 2 + i).filter(year => year >= 2000 && year <= 2100).flatMap(year => arabicMonths.map((name, index) => { const value = `${year}-${String(index + 1).padStart(2, "0")}`; return <option key={value} value={value}>{name} {year}</option>; }))}</select>
        <button type="button" aria-label="الشهر التالي" onClick={() => changeMonth(1)} disabled={data.reportPeriod >= "2100-12"}><ChevronLeft size={18} /></button>
      </div>
      <div className={styles.viewSwitch} role="group" aria-label="عرض الجدول"><button type="button" aria-pressed={data.viewMode === "month"} onClick={() => data.setViewMode("month")}>الشهر</button><button type="button" aria-pressed={data.viewMode === "week"} onClick={() => data.setViewMode("week")}>الأسبوع</button></div>
    </section>
    <AttendanceStats groups={data.groups} students={data.monthlyStudents} monthDates={data.monthSessionDates} cancelledSessions={new Set(selectedGroup?.cancelled_sessions || [])} attendance={data.attendance} selectedMonth={data.selectedMonth} selectedYear={data.selectedYear} now={data.now} />
    {data.tableLoading ? <div className={styles.loading} role="status"><LoaderCircle size={18} className={styles.spin} />جاري تحميل الحضور</div> : <AttendanceTable key={`${data.selectedGradeId}-${data.selectedGroupId}-${data.viewMode}-${data.period.start}`} students={data.filteredStudents} sessionDates={data.sessionDates} attendance={data.attendance} selectedGroupId={data.selectedGroupId} selectedMonth={data.selectedMonth} selectedYear={data.selectedYear} groups={data.groups} weekOffset={data.weekOffset} onWeekChange={data.setWeekOffset} viewMode={data.viewMode} now={data.now} readOnly={data.readOnly} onToggle={actions.handleToggle} onMarkAll={actions.handleMarkAllSession} onClearSession={actions.handleClearSession} onCancelSession={actions.handleToggleCancelSession} onRevokeResolution={actions.handleRevokeResolution} onShowQR={setQrStudent} onShowToast={showToast} isSaving={actions.isSaving} isCellSaving={actions.isCellSaving} />}
    <QRModal student={qrStudent} onClose={() => setQrStudent(null)} />
    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
  </main>;
}
