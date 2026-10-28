"use client";

import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";

import { useStudentReports } from "./_hooks/useStudentReports";
import ReportsHeader from "./_components/ReportsHeader";
import ReportsFilters from "./_components/ReportsFilters";
import ReportsStatsCards from "./_components/ReportsStatsCards";
import StudentsReportTable from "./_components/StudentsReportTable";
import TopStudentsSection from "./_components/TopStudentsSection";

import "@/app/styles/studentReports.css";

export default function StudentReportsPage() {
  const {
    loading,
    grades, groups,
    filteredStudents, pagedStudents, filteredGroups,
    stats,
    getStudentAttendance,
    isStudentPaid,
    lastAttendanceMap,
    last10Sessions,
    teacherBooks,
    sendWhatsApp,
    toast, setToast,
    searchQuery, setSearchQuery,
    filterGradeId, setFilterGradeId,
    filterGroupId, setFilterGroupId,
    selectedMonthIndex, setSelectedMonthIndex,
    selectedYear, setSelectedYear,
    page, setPage, totalPages,
    getStudentLastExam,
    examAverages,
    studentSubsInfo,
    filterPayment, setFilterPayment,
    sortKey, sortDir, onSort,
    isMonthLoading,
  } = useStudentReports();

  if (loading) return <Spinner fullScreen />;

  return (
    <div className="sr-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ReportsHeader
        monthIndex={selectedMonthIndex}
        year={selectedYear}
        totalFiltered={filteredStudents.length}
        allStudents={filteredStudents}
        grades={grades}
        groups={groups}
        getAttendance={getStudentAttendance}
        isStudentPaid={isStudentPaid}
        last10Sessions={last10Sessions}
        studentSubsInfo={studentSubsInfo}
        getLastExam={getStudentLastExam}
      />

      <ReportsStatsCards
        total={stats.total}
        attendancePct={stats.attendancePct}
        atRisk={stats.atRisk}
        highAbsence={stats.highAbsence}
      />

      <ReportsFilters
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        selectedMonthIndex={selectedMonthIndex} setSelectedMonthIndex={setSelectedMonthIndex}
        selectedYear={selectedYear} setSelectedYear={setSelectedYear}
        filterGradeId={filterGradeId} setFilterGradeId={setFilterGradeId}
        filterGroupId={filterGroupId} setFilterGroupId={setFilterGroupId}
        filterPayment={filterPayment} setFilterPayment={setFilterPayment}
        grades={grades} filteredGroups={filteredGroups} allGroups={groups}
      />

      <TopStudentsSection
        students={filteredStudents}
        grades={grades}
        groups={groups}
        getAttendance={getStudentAttendance}
        isStudentPaid={isStudentPaid}
        getLastExam={getStudentLastExam}
        studentSubsInfo={studentSubsInfo}
        examAverages={examAverages}
        onSendWhatsApp={sendWhatsApp}
      />

      <StudentsReportTable
        students={pagedStudents}
        grades={grades}
        groups={groups}
        teacherBooks={teacherBooks}
        getAttendance={getStudentAttendance}
        isStudentPaid={isStudentPaid}
        lastAttendanceMap={lastAttendanceMap}
        last10Sessions={last10Sessions}
        studentSubsInfo={studentSubsInfo}
        selectedMonthIndex={selectedMonthIndex}
        selectedYear={selectedYear}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        totalFiltered={filteredStudents.length}
        onSendWhatsApp={sendWhatsApp}
        getLastExam={getStudentLastExam}
        examAverages={examAverages}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        isMonthLoading={isMonthLoading}
      />
    </div>
  );
}
