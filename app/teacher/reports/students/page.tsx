"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import Link from "next/link";
import { RiWhatsappLine } from "react-icons/ri";
import { WhatsAppService } from "@/lib/services/whatsappService";

import { useStudentReports } from "./_hooks/useStudentReports";
import ReportsHeader from "./_components/ReportsHeader";
import ReportsFilters from "./_components/ReportsFilters";
import ReportsStatsCards from "./_components/ReportsStatsCards";
import StudentsReportTable from "./_components/StudentsReportTable";
import WhatsAppTemplateModal from "./_components/WhatsAppTemplateModal";
import TopStudentsSection from "./_components/TopStudentsSection";

import "@/app/styles/studentReports.css";

export default function StudentReportsPage() {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [waStatus, setWaStatus] = useState<"connected" | "disconnected" | "loading">("loading");

  useEffect(() => {
    WhatsAppService.getStatus()
      .then((d) => setWaStatus(d.status === "connected" ? "connected" : "disconnected"))
      .catch(() => setWaStatus("disconnected"));
  }, []);

  const {
    loading,
    students,
    grades, groups,
    filteredStudents, pagedStudents, filteredGroups,
    stats,
    getStudentAttendance,
    getAllTimeAttendance,
    isStudentPaid,
    lastAttendanceMap,
    last10Sessions,
    teacherBooks,
    whatsappTemplate, setWhatsappTemplate,
    sendWhatsApp,
    sendAllWhatsApp,
    toast, setToast,
    searchQuery, setSearchQuery,
    filterGradeId, setFilterGradeId,
    filterGroupId, setFilterGroupId,
    selectedMonthIndex, setSelectedMonthIndex,
    selectedYear, setSelectedYear,
    page, setPage, totalPages,
    getStudentLastExam,
    allExamGrades,
    studentSubsInfo,
  } = useStudentReports();

  if (loading) return <Spinner fullScreen />;

return (
    <div className="sr-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* {waStatus === "disconnected" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", marginBottom: "0.5rem" }}>
          <RiWhatsappLine size={18} color="#ef4444" />
          <span style={{ fontSize: "0.85rem", color: "#ef4444", flex: 1 }}>الواتساب غير متصل — لن تتمكن من إرسال التقارير</span>
          <Link href="/teacher/whatsapp" style={{ fontSize: "0.82rem", color: "#ef4444", fontWeight: 700, textDecoration: "underline" }}>ربط الآن</Link>
        </div>
      )} */}

      {showTemplateModal && (
        <WhatsAppTemplateModal
          template={whatsappTemplate}
          onSave={setWhatsappTemplate}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      <ReportsHeader
        monthIndex={selectedMonthIndex}
        year={selectedYear}
        totalFiltered={filteredStudents.length}
        withPhone={stats.withPhone}
        onSendAll={sendAllWhatsApp}
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
        grades={grades} filteredGroups={filteredGroups} allGroups={groups}
      />

      <TopStudentsSection
        students={students}
        grades={grades}
        groups={groups}
        getAttendance={getStudentAttendance}
        isStudentPaid={isStudentPaid}
        getLastExam={getStudentLastExam}
        studentSubsInfo={studentSubsInfo}
        allExamGrades={allExamGrades}
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
      />
    </div>
  );
}
