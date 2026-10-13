"use client";

import { useState } from "react";
import { BarChart3, Users, FolderOpen, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { useAttendanceReports } from "./_hooks/useAttendanceReports";
import { ReportFilters } from "./_components/ReportFilters";
import { ReportStatsCards } from "./_components/ReportStatsCards";
import { StudentReportTab } from "./_components/StudentReportTab";
import { GroupReportTab } from "./_components/GroupReportTab";
import { AbsenteesTab } from "./_components/AbsenteesTab";
import { LastSessionTab } from "./_components/LastSessionTab";

type Tab = "students" | "groups" | "absentees" | "last-session";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "students",  label: "تقرير الطلاب",       icon: <Users size={15} /> },
  { key: "groups",    label: "تقرير المجموعات",     icon: <FolderOpen size={15} /> },
  { key: "absentees", label: "الغائبون المتكررون",  icon: <AlertTriangle size={15} /> },
  { key: "last-session", label: "غائبو آخر حصة", icon: <Users size={15} /> },
];

export default function AttendanceReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("students");

  const {
    loading,
    grades, availableGrades, availableGroups, groups,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    selectedGradeId, setSelectedGradeId,
    selectedGroupId, setSelectedGroupId,
    absentThreshold, setAbsentThreshold,
    studentRows, groupRows, absenteeRows,
    stats, getLastSessionAbsentees,
    fetchLastSessionIfNeeded,
  } = useAttendanceReports();

  if (loading) return <Spinner fullScreen />;

  return (
    <div className="flex flex-col gap-3 sm:gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-[42px] h-[42px] sm:w-[50px] sm:h-[50px] rounded-[14px] bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/30 text-teal-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
          <BarChart3 size={19} />
        </div>
        <div>
          <h1 className="text-[1.2rem] sm:text-[1.6rem] font-bold leading-tight bg-gradient-to-br from-slate-100 to-slate-400 bg-clip-text text-transparent">
            تقارير الحضور والغياب
          </h1>
          <p className="text-[0.72rem] sm:text-sm text-slate-400 mt-0.5">عرض وتحليل بيانات الحضور — للقراءة فقط</p>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters
        grades={availableGrades}
        availableGroups={availableGroups}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        selectedGradeId={selectedGradeId}
        selectedGroupId={selectedGroupId}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onGradeChange={setSelectedGradeId}
        onGroupChange={setSelectedGroupId}
      />

      {/* Stats */}
      <ReportStatsCards
        total={stats.total}
        avgPct={stats.avgPct}
        below75={stats.below75}
        perfect={stats.perfect}
      />

      {/* Tabs panel */}
      <div className="bg-[var(--bg-card)] border border-white/[0.07] rounded-[14px] overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-white/[0.07] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "last-session") fetchLastSessionIfNeeded();
              }}
              className={`flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-3 sm:px-5 py-2.5 text-xs sm:text-[0.83rem] font-semibold whitespace-nowrap transition-all border-b-2 flex-shrink-0 ${
                activeTab === tab.key
                  ? "border-teal-500 text-teal-400 bg-teal-500/[0.06]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.key === "absentees" && absenteeRows.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 text-[0.6rem] font-bold leading-none">
                  {absenteeRows.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-3 sm:p-4">
          {activeTab === "students" && (
            <StudentReportTab
              rows={studentRows}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          )}
          {activeTab === "groups" && <GroupReportTab rows={groupRows} />}
          {activeTab === "absentees" && (
            <AbsenteesTab
              rows={absenteeRows}
              threshold={absentThreshold}
              onThresholdChange={setAbsentThreshold}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          )}
          {activeTab === "last-session" && (
            <LastSessionTab
              groups={availableGroups}
              getLastSessionAbsentees={getLastSessionAbsentees}
            />
          )}
        </div>
      </div>
    </div>
  );
}
