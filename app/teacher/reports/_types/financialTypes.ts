export type PeriodType =
  | "current_month"
  | "specific_month"
  | "current_academic_year"
  | "previous_academic_year";

export interface AcademicYearOption {
  key: string;
  label: string; // e.g. "2026/2027"
  startYear: number;
  endYear: number;
  activeMonths: { month: number; year: number }[];
  isCurrent: boolean;
}

export interface FinancialFilters {
  periodType: PeriodType;
  selectedAcademicYear: string;
  selectedYear: number;
  selectedMonth: number; // 1-12
  selectedGradeId: string; // "all" | id
  selectedGroupId: string; // "all" | id
  selectedTeacherId: string; // "all" | id
  // Optional backwards compatibility fields
  customStartDate?: string;
  customEndDate?: string;
  selectedPaymentMethod?: string;
}

export interface FinancialKPIs {
  totalCollected: number;
  totalDue: number;
  outstandingDebt: number;
  collectionRate: number; // 0-100
  subscriptionCollected: number;
  bookCollected: number;
  totalExpenses: number;
  netProfit: number;
  payingStudentsCount: number;
  totalEligibleStudents: number;
  unpaidStudentsCount: number;
  isMonthActive: boolean;
  periodLabel: string;
}

export interface DailyRevenuePoint {
  day: number;
  dateStr: string;
  dateLabel: string;
  subscriptions: number;
  books: number;
  total: number;
}

export interface MonthlySummaryRow {
  month: number;
  year: number;
  name: string;
  isActive: boolean;
  isCurrentMonth: boolean;
  due: number;
  collected: number;
  remaining: number;
  collectionRate: number;
  payingCount: number;
  debtCount: number;
  expenses: number;
  netProfit: number;
}

export interface StageRevenueRow {
  id: string;
  name: string;
  totalStudents: number;
  paidStudents: number;
  totalDue: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
}

export interface GroupRevenueRow {
  id: string;
  name: string;
  gradeId?: string | null;
  gradeName: string;
  totalStudents: number;
  paidStudents: number;
  totalDue: number;
  totalCollected: number;
  remaining: number;
  collectionRate: number;
}

export interface PaymentTransactionRow {
  id: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  groupId?: string | null;
  groupName: string;
  gradeName: string;
  month: number;
  year: number;
  monthLabel: string;
  paidAt: string;
  paidAtTimestamp: number;
  amount: number;
  method: string;
  receiptNumber?: string | null;
  status: "paid";
}

export interface OutstandingStudentRow {
  studentId: string;
  studentName: string;
  studentCode?: string;
  groupId?: string | null;
  groupName: string;
  gradeName: string;
  overdueMonths: {
    month: number;
    year: number;
    label: string;
    amount: number;
    discount: number;
    netAmount: number;
  }[];
  originalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  latestDueDate: string;
  overdueCount: number;
  statusLabel: string;
}

export interface GradeStat {
  id: string;
  name: string;
  paidThisMonth: number;
  earnings: number;
}

export interface BookStat {
  id: string;
  name: string;
  price: number;
  count: number;
  earnings: number;
  gradeName?: string;
}
