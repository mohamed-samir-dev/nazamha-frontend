import { Student, Grade, Group, BookDef } from "@/lib/types";

export const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export type Subscription = { student_id: string; status: string; month: number; year: number };

export interface TableProps {
  students: Student[];
  grades: Grade[];
  groups: Group[];
  teacherBooks: BookDef[];
  getAttendance: (id: string) => { present: number; absent: number; total: number };
  isStudentPaid: (id: string) => boolean;
  lastAttendanceMap: Map<string, string>;
  last10Sessions: Set<string>;
  studentSubsInfo: Map<string, { lastPaidMonth: string; arrears: number; hasAllPaid: boolean }>;
  selectedMonthIndex: number;
  selectedYear: number;
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  totalFiltered: number;
  onSendWhatsApp: (student: Student) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  isMonthLoading?: boolean;
  examAverages?: Map<string, number | null>;
}

export type AlertItem = { type: "expulsion" | "absence" | "arrears" | "star"; title: string };
export type SortKey = "attendancePct" | "absent" | "name" | "lastAttendance";
export type SortDir = "asc" | "desc";
