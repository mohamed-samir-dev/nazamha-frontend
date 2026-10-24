"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, ScanLine, CalendarDays } from "lucide-react";

import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";

import { useAttendanceData } from "./_hooks/useAttendanceData";
import { useAttendanceActions } from "./_hooks/useAttendanceActions";
import { useAutoAbsent } from "./_hooks/useAutoAbsent";
import { AttendanceFilters } from "./_components/AttendanceFilters";
import { AttendanceStats } from "./_components/AttendanceStats";
import { AttendanceTable } from "./_components/AttendanceTable";
import { QRModal } from "./_components/QRModal";
import { ConfirmDeleteModal } from "./_components/ConfirmDeleteModal";
import { AttendancePrintButton } from "./_components/AttendancePrintButton";
import { exportAttendanceMonth } from "./_utils/exportUtils";
import { AttendanceReportModal } from "./_components/AttendanceReportModal";
import { useOnlineSync } from "./scan/_hooks/useOnlineSync";
import { Student } from "@/lib/types";
import { getMonthCairo,getYearCairo } from "@/lib/utils/dateUtils";

export default function AttendancePage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);
  const [reportOpen,setReportOpen]=useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const data = useAttendanceData(false);

  useOnlineSync((count) => {
    if (count > 0) data.loadAttendance();
  });

  useAutoAbsent(data.groups, data.weekOffset, data.loadAttendance);

  const actions = useAttendanceActions({
    userId: data.userId,
    attendance: data.attendance,
    setAttendance: data.setAttendance,
    filteredStudents: data.filteredStudents,
    showToast,
    updateGroupLocally: data.updateGroupLocally,
    weekOffset: data.weekOffset,
  });

  const selectedGroup = data.groups.find(g => g.id === data.selectedGroupId);

  const cancelledSet = new Set(
    data.selectedGroupId !== "all"
      ? (selectedGroup?.cancelled_sessions ?? [])
      : []
  );

  if (data.loading) return <Spinner fullScreen />;

  if (data.error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p>{data.error}</p><button className="btn btn-secondary mt-3" onClick={() => window.location.reload()}>إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] rounded-[14px] bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/30 text-teal-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-[1.3rem] sm:text-[1.6rem] font-bold mb-0.5 bg-gradient-to-br from-slate-100 to-slate-400 bg-clip-text text-transparent">
              سجل الحضور
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
              <CalendarDays size={12} className="inline ml-1" />
              {new Date(Date.UTC(getYearCairo(),getMonthCairo()-1,1)).toLocaleDateString("ar-EG",{month:"long",year:"numeric",timeZone:"Africa/Cairo"})}
              {selectedGroup ? ` — ${selectedGroup.name}` : ""}
            </p>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 items-stretch gap-2 sm:flex sm:w-auto sm:items-center">
          {(
            <AttendancePrintButton
              onPrint={async() => {setReportOpen(true);}}
              onError={message => showToast(message, "error")}
            />
          )}
          <Link
            href="/teacher/attendance/scan"
            className="inline-flex min-h-11 items-center justify-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-[10px] bg-teal-500 text-white text-[0.85rem] sm:text-[0.9rem] font-semibold no-underline transition-all shadow-[0_4px_14px_rgba(20,184,166,0.3)] hover:bg-teal-600 hover:-translate-y-px"
          >
            <ScanLine size={16} />
            <span>سكان QR</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <AttendanceFilters
        grades={data.grades}
        groups={data.groups}
        selectedGradeId={data.selectedGradeId}
        selectedGroupId={data.selectedGroupId}
        onGradeChange={v => { data.setSelectedGradeId(v); data.setSelectedGroupId("all"); }}
        onGroupChange={data.setSelectedGroupId}
      />

      {/* Stats */}
      <AttendanceStats
        groups={data.groups}
        students={data.monthlyStudents}
        monthDates={data.monthSessionDates}
        cancelledSessions={cancelledSet}
        attendance={data.attendance}
        selectedMonth={data.selectedMonth}
        selectedYear={data.selectedYear}
      />

      {/* Table */}
      <div className="glass-panel overflow-hidden py-4">
        <AttendanceTable key={`${data.selectedGradeId}-${data.selectedGroupId}-${data.weekOffset}`}
          students={data.filteredStudents}
          sessionDates={data.sessionDates}
          attendance={data.attendance}
          selectedGroupId={data.selectedGroupId}
          selectedMonth={data.selectedMonth}
          selectedYear={data.selectedYear}
          groups={data.groups}
          weekOffset={data.weekOffset}
          onWeekChange={data.setWeekOffset}
          isPresent={actions.isPresent}
          getAttendancePercent={actions.getAttendancePercent}
          onToggle={actions.handleToggle}
          onMarkAll={actions.handleMarkAllSession}
          onClearSession={actions.handleClearSession}
          onCancelSession={actions.handleToggleCancelSession}
          onShowQR={setQrStudent}
          onShowToast={showToast}
          isSaving={actions.isSaving}
          isCellSaving={actions.isCellSaving}
        />
      </div>

      {/* Modals */}
      <QRModal student={qrStudent} onClose={() => setQrStudent(null)} />
      {reportOpen&&<AttendanceReportModal month={getMonthCairo()} year={getYearCairo()} onClose={()=>setReportOpen(false)} onReport={(month,year)=>exportAttendanceMonth(month,year,{gradeId:data.selectedGradeId,groupId:data.selectedGroupId})}/>}

      {actions.pendingDelete && (
        <ConfirmDeleteModal
          studentName={actions.pendingDelete.studentName}
          onConfirm={actions.confirmDelete}
          onCancel={() => actions.setPendingDelete(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
