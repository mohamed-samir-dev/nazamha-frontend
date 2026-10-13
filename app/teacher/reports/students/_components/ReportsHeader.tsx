"use client";

import { HiOutlineDocumentChartBar } from "react-icons/hi2";
import { LuPrinter } from "react-icons/lu";
import { Student, Grade, Group, Exam } from "@/lib/types";
import { printAllStudentsReport } from "../_utils/printAllStudents";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

interface Props {
  monthIndex: number;
  year: number;
  totalFiltered: number;
  withPhone: number;
  onSendAll: () => void;
  allStudents: Student[];
  grades: Grade[];
  groups: Group[];
  getAttendance: (id: string) => { present: number; absent: number; total: number };
  isStudentPaid: (id: string) => boolean;
  last10Sessions: Set<string>;
  studentSubsInfo: Map<string, { lastPaidMonth: string; arrears: number; hasAllPaid: boolean }>;
  getLastExam?: (id: string) => (Exam & { score: number | null }) | null;
}

export default function ReportsHeader({
  monthIndex, year, totalFiltered, withPhone, onSendAll,
  allStudents, grades, groups, getAttendance, isStudentPaid, last10Sessions, studentSubsInfo, getLastExam,
}: Props) {
  const handlePrint = () =>
    printAllStudentsReport(
      allStudents, grades, groups, getAttendance, isStudentPaid,
      last10Sessions, studentSubsInfo, monthIndex, year, getLastExam
    );

  return (
    <div className="sr-header">
      <div className="sr-header-title">
        <div className="sr-header-icon">
          <HiOutlineDocumentChartBar size={26} />
        </div>
        <div>
          <h1>تقارير الطلاب</h1>
          <p>
            <span>{arabicMonths[monthIndex]} {year}</span>
            <span className="sr-header-dot" />
            <span>{totalFiltered} طالب</span>
          </p>
        </div>
      </div>
      <div className="sr-header-actions">
        <button className="sr-btn sr-btn-print" onClick={handlePrint} disabled={allStudents.length === 0}>
          <LuPrinter size={17} />
          طباعة الكل ({allStudents.length})
        </button>
      </div>
    </div>
  );
}
